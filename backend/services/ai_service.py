import uuid

async def generate_questions_from_text(text):
    return [
        {
            "id": str(uuid.uuid4()),
            "question": "What is AI?",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A"
        }
    ]