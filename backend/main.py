from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, boats, bookings, auth, marinas, partner_prices

app = FastAPI(
    title="Funntour API",
    description="API para sistema de gerenciamento de embarcações e rotas",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, ajuste para domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(boats.router, prefix="/api/boats", tags=["boats"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(marinas.router, prefix="/api/marinas", tags=["marinas"])
app.include_router(partner_prices.router, prefix="/api/partner-prices", tags=["partner-prices"])

@app.get("/")
async def root():
    return {"message": "Funntour API is running"}
