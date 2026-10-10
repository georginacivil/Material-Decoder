import feedparser
import requests
import csv
import time
import os

# --- 1. ΡΥΘΜΙΣΕΙΣ ---
API_KEY = "AQ.Ab8RN6Lk9H_glF8A1w-P7g-Ud794ZYL53aX_8RJ1_-m8ZEpQaw"
# Παράδειγμα RSS Feed (Μπορείς να βάλεις B2Green, ArchDaily, Κτίριο κτλ)
RSS_FEED_URL = "https://www.archdaily.com/rss.xml" 
CSV_FILENAME = "news.csv"

def summarize_with_ai(title, description):
    prompt = f"""
    Είσαι αρχισυντάκτης σε ένα σύγχρονο portal για μηχανικούς και αρχιτέκτονες στην Ελλάδα. 
    Γράψε μια έξυπνη, επαγγελματική περίληψη στα Ελληνικά, αυστηρά σε 2-3 προτάσεις, για την παρακάτω είδηση.
    Εστίασε στην καινοτομία, τα υλικά ή τη σημασία του έργου.
    
    Τίτλος Είδησης: {title}
    Περιεχόμενο: {description}
    
    Επέστρεψε ΜΟΝΟ την περίληψη, χωρίς επικεφαλίδες, χωρίς εισαγωγικά και χωρίς markdown.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    
    # Μηχανισμός προστασίας από φόρτο της Google (Error 503)
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                clean_text = result['candidates'][0]['content']['parts'][0]['text'].strip().replace('\n', ' ')
                return clean_text
            elif response.status_code == 503:
                print(f"🔄 Υπερφόρτωση Google (503). Αναμονή 15 δευτερόλεπτα... ({attempt+1}/3)")
                time.sleep(15)
            else:
                print(f"❌ Σφάλμα AI {response.status_code}: {response.text}")
                return "Μη διαθέσιμη περίληψη."
        except Exception as e:
            print(f"❌ Σφάλμα σύνδεσης AI: {e}")
            return "Μη διαθέσιμη περίληψη."
            
    return "Μη διαθέσιμη περίληψη."

def fetch_and_process_news():
    print(f"📡 Γίνεται σάρωση ειδήσεων από το: {RSS_FEED_URL}")
    feed = feedparser.parse(RSS_FEED_URL)
    
    if not feed.entries:
        print("❌ Δεν βρέθηκαν ειδήσεις στο RSS Link.")
        return
        
    # Επιλέγουμε να πάρουμε τις 5 πιο πρόσφατες ειδήσεις για να μην φρακάρει ο server
    recent_entries = feed.entries[:5]
    
    print(f"🗞️ Βρέθηκαν {len(recent_entries)} νέες ειδήσεις. Ξεκινάει η επεξεργασία AI...\n")
    
    for entry in recent_entries:
        title = entry.title
        link = entry.link
        # Καθαρισμός ημερομηνίας
        date = entry.published if hasattr(entry, 'published') else "Σήμερα"
        description = entry.description if hasattr(entry, 'description') else title
        
        print(f"⏳ AI Περίληψη για: '{title[:50]}...'")
        summary = summarize_with_ai(title, description)
        
        # Αποθήκευση στο CSV
        try:
            with open(CSV_FILENAME, mode='a', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerow([date, title, summary, link])
            print(f"✅ Αποθηκεύτηκε επιτυχώς!\n")
        except Exception as e:
            print(f"❌ Σφάλμα αποθήκευσης: {e}\n")
            
        time.sleep(10) # Ασφαλής παύση για το Rate Limit της Google

if __name__ == "__main__":
    print("=== 🤖 Material Decoder: AI ΑΡΧΙΣΥΝΤΑΚΤΗΣ ===\n")
    
    # 1. Δημιουργία του αρχείου και των στηλών, αν δεν υπάρχει ήδη
    if not os.path.exists(CSV_FILENAME):
        with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Date", "Title", "Summary", "Link"])
            
    # 2. Έναρξη σάρωσης
    fetch_and_process_news()
    
    print("🎉 Η ανανέωση του Newsfeed ολοκληρώθηκε!")