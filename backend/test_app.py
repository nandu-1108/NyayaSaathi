from app import app

client=app.test_client()
payload={"Problem":"someone mis using my photos"}



def test_home():
    response=client.get("/")
    assert response.status_code==200

def test_analyse_success():
    response=client.post("/analyse",json=payload)
    assert response.status_code==200

def test_analyse_empty_success():
    response=client.post("/analyse",json=payload)
    assert response.status_code==400