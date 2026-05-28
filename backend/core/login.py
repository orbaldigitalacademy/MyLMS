class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "sub": user["id"],
        "role": user["role"]
    })

    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }