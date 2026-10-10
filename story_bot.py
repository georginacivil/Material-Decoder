import csv
import time
import requests
import os
from datetime import datetime

API_KEY = "AQ.Ab8RN6Lk9H_glF8A1w-P7g-Ud794ZYL53aX_8RJ1_-m8ZEpQaw"
INPUT_FILE = "stories_notes.txt"
OUTPUT_FILE = "stories.csv"

def analyze_story(notes):
    print(f"⏳ Συγγραφή Case Study από σημειώσεις...")
    
    prompt = f"""
    Είσαι βετεράνος πολιτικός μηχανικός. Μετάτρεψε τις παρακάτω πρόχειρες σημειώσεις σε ένα επαγγελματικό Case Study αστοχίας υλικών.
    
    Σημειώσεις: "{notes}"
    
    Εξήγαγε ΑΥΣΤΗΡΑ 5 πεδία χωρισμένα με | (χωρίς αλλαγές γραμμής):
    Title | Problem | Cause | Solution | Tags
    
    Οδηγίες:
    - Title: Ένας ελκυστικός τίτλος (π.χ. Γιατί ράγισε ο σοβάς;).
    - Problem: Η περιγραφή της αστοχίας (2-3 προτάσεις).
    - Cause: Η επιστημονική/τεχνική αιτία του λάθους.
    - Solution: Η σωστή πρακτική / λύση.
    - Tags: 3 λέξεις-κλειδιά χωρισμένες με κόμμα.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                clean_text = response.json()['candidates'][0]['content']['parts'][0]['text'].strip().replace('\n', '')
                columns = [item.strip() for item in clean_text.split('|')]
                
                # Προσθήκη σημερινής ημερομηνίας στην αρχή της λίστας
                today = datetime.now().strftime("%Y-%m-%d")
                return [today] + columns[:5]
                
            elif response.status_code == 503:
                time.sleep(15)
            else:
                return []
        except Exception as e:
            return []
    return []

if __name__ == "__main__":
    print("=== 🏗️ Material Decoder: STORY BOT ===\n")
    
    if not os.path.exists(INPUT_FILE):
        print("❌ Το αρχείο notes δεν υπάρχει.")
        exit()
        
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        notes = f.read().strip()
        
    if not notes:
        print("🛑 Οι σημειώσεις είναι άδειες.")
        exit()
        
    story_data = analyze_story(notes)
    
    if len(story_data) == 6:
        with open(OUTPUT_FILE, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(story_data)
        print("✅ Το νέο Story αποθηκεύτηκε με επιτυχία!")
        
        # Καθαρισμός του αρχείου σημειώσεων μετά την επιτυχία
        with open(INPUT_FILE, "w", encoding="utf-8") as f:
            f.write("")
    else:
        print("❌ Σφάλμα κατά τη δημιουργία του Story.")