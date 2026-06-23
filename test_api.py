import requests
import json

BASE_URL = "http://127.0.0.1:5000"

print("🧪 Testando API FinWise")
print("=" * 50)

# 1. Teste rota raiz
print("\n1️⃣ Testando rota raiz:")
try:
    resp = requests.get(f"{BASE_URL}/")
    print(f"✅ Status: {resp.status_code}")
    print(f"Resposta: {json.dumps(resp.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"❌ Erro: {e}")

# 2. Teste registro
print("\n2️⃣ Testando registro de usuário:")
try:
    data = {
        "email": "teste@finwise.com",
        "nome": "Teste User",
        "senha": "123456"
    }
    resp = requests.post(f"{BASE_URL}/auth/registro", json=data)
    print(f"✅ Status: {resp.status_code}")
    print(f"Resposta: {json.dumps(resp.json(), indent=2, ensure_ascii=False)}")
    token = None
except Exception as e:
    print(f"❌ Erro: {e}")

# 3. Teste login
print("\n3️⃣ Testando login:")
try:
    data = {
        "email": "teste@finwise.com",
        "senha": "123456"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"✅ Status: {resp.status_code}")
    result = resp.json()
    print(f"Resposta: {json.dumps(result, indent=2, ensure_ascii=False)}")
    if 'token' in result:
        token = result['token']
        print(f"Token obtido: {token[:20]}...")
except Exception as e:
    print(f"❌ Erro: {e}")

print("\n" + "=" * 50)
print("✅ Testes concluídos!")
