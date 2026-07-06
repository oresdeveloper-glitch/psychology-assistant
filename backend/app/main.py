import os
import gzip
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response

from app.api.routes import router
from app.api.auth import router as auth_router
from app.models.database import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Psychology Assistant - Mental Health Monitoring API",
    description="Multimodal sensor + voice feature fusion for mental wellness screening",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)

GZIP_CACHE = {}
GZIP_MTIME = {}

def gzip_file(filepath):
    try:
        mtime = os.path.getmtime(filepath)
    except Exception:
        mtime = 0
    cached_entry = GZIP_CACHE.get(filepath)
    cached_mtime = GZIP_MTIME.get(filepath, 0)
    if cached_entry is not None and mtime == cached_mtime:
        return cached_entry
    try:
        with open(filepath, "rb") as f:
            data = f.read()
        compressed = gzip.compress(data)
        GZIP_CACHE[filepath] = compressed
        GZIP_MTIME[filepath] = mtime
        logger.info("Gzipped %s: %d -> %d bytes", filepath, len(data), len(compressed))
        return compressed
    except Exception as e:
        logger.error("gzip error %s: %s", filepath, e)
        return None

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIR):
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        file_path = os.path.join(FRONTEND_DIR, full_path) if full_path else os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(file_path):
            if file_path.endswith((".js", ".css", ".html", ".json", ".svg", ".woff2")):
                compressed = gzip_file(file_path)
                if compressed:
                    content_type = "text/javascript" if file_path.endswith(".js") else \
                                   "text/css" if file_path.endswith(".css") else \
                                   "text/html" if file_path.endswith(".html") else \
                                   "application/json" if file_path.endswith(".json") else \
                                   "image/svg+xml" if file_path.endswith(".svg") else \
                                   "application/octet-stream"
                    is_html = file_path.endswith(".html")
                    content = compressed
                    if is_html:
                        decoded = gzip.decompress(compressed).decode("utf-8")
                        head_end = decoded.find("</head>")
                        if head_end != -1:
                            script = '<script>(function(){var s=document.querySelector(\'script[src*="/assets/index-"]\');if(!s)return;var m=s.src.match(/index-([^.]+)\\.js/);if(!m)return;var h=m[1];var p=sessionStorage.getItem("_kh");if(p&&p!==h){sessionStorage.removeItem("_kh");location.reload()}else if(!p)sessionStorage.setItem("_kh",h)})();</script>'
                            decoded = decoded[:head_end] + script + decoded[head_end:]
                            content = gzip.compress(decoded.encode("utf-8"))
                    return Response(
                        content=content,
                        media_type=content_type,
                        headers={
                            "Content-Encoding": "gzip",
                            "Cache-Control": "no-cache, no-store, must-revalidate" if is_html else "public, max-age=31536000, immutable",
                        }
                    )
            return FileResponse(file_path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
        index = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index, media_type="text/html", headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    logger.info("Serving frontend from %s", FRONTEND_DIR)
else:
    logger.warning("Frontend dist not found at %s. Run 'npm run build' in frontend/", FRONTEND_DIR)


@app.on_event("startup")
async def startup():
    from app.services.live_mqtt import start_live_mqtt
    from app.services.tcp_server import start_tcp_server
    start_live_mqtt()
    start_tcp_server()
    logger.info("Psychology Assistant API started")
