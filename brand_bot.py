import csv
import time
import requests
import os

# --- 1. ΡΥΘΜΙΣΕΙΣ & API KEY ---
API_KEY = "AQ.Ab8RN6Lk9H_glF8A1w-P7g-Ud794ZYL53aX_8RJ1_-m8ZEpQaw"
INPUT_FILE = "brands_input.txt"
OUTPUT_FILE = "brands.csv"

def load_brands_from_file(filename):
    if not os.path.exists(filename):
        print(f"❌ Το αρχείο '{filename}' δεν βρέθηκε! Φτιάξε το αρχείο και βάλε τα ονόματα των brands.")
        return []
    with open(filename, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    return lines

def analyze_brand_auto(brand_name):
    print(f"⏳ Αναζήτηση στοιχείων για την εταιρεία: '{brand_name}'...")
    
    prompt = f"""
    Είσαι ένας κορυφαίος αναλυτής της κατασκευαστικής αγοράς. Βρες πληροφορίες για την εταιρεία δομικών υλικών: '{brand_name}'.
    
    Εξήγαγε και δημιούργησε τα εξής δεδομένα, χωρισμένα ΑΥΣΤΗΡΑ με το σύμβολο | (χωρίς αλλαγές γραμμής):
    Brand_Name | Short_Profile | Origin | Website | Tech_Support | Core_Category
    
    Οδηγίες:
    - Το Brand_Name πρέπει να είναι: {brand_name}
    - Short_Profile: Γράψε 2-3 επαγγελματικές προτάσεις για την ιστορία και την εξειδίκευση της εταιρείας.
    - Origin: Χώρα προέλευσης / Κεντρική Έδρα (π.χ. Ιταλία, Ελβετία, Ελλάδα).
    - Website: Το επίσημο website της (π.χ. www.mapei.com). Αν δεν βρεθεί, γράψε 'Μη διαθέσιμο'.
    - Tech_Support: Το τηλέφωνο ή email της τεχνικής υποστήριξης. Αν δεν βρεθεί, γράψε 'Κατόπιν ζήτησης'.
    - Core_Category: Η κύρια κατηγορία υλικών (π.χ. Στεγανωτικά & Κόλλες).
    - ΜΗΝ βάλεις επικεφαλίδες ή markdown. Επέστρεψε ΜΟΝΟ τα 6 πεδία χωρισμένα με |.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {"contents": [{"parts": [{"text": prompt}]}]}
    
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                result = response.json()
                clean_text = result['candidates'][0]['content']['parts'][0]['text'].strip().replace('\n', '')
                columns = [item.strip() for item in clean_text.split('|')]
                
                while len(columns) < 6:
                    columns.append("N/A")
                return columns[:6]
                
            elif response.status_code == 503:
                print(f"🔄 Υπερφόρτωση Google (503). Αυτόματη αναμονή 15 δευτερόλεπτα... ({attempt+1}/3)")
                time.sleep(15)
            else:
                print(f"❌ Σφάλμα {response.status_code} από Google: {response.text}")
                return []
        except Exception as e:
            print(f"❌ Σφάλμα σύνδεσης: {e}")
            return []
            
    print(f"❌ Αποτυχία μετά από 3 προσπάθειες για την εταιρεία {brand_name}.")
    return []

def save_to_csv(data_list, filename=OUTPUT_FILE):
    try:
        with open(filename, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(data_list)
        print(f"✅ Επιτυχία! Η εταιρεία {data_list[0]} αποθηκεύτηκε στο {filename}.\n")
    except Exception as e:
        print(f"❌ Σφάλμα κατά την αποθήκευση: {e}")

if __name__ == "__main__":
    print("=== 🏢 Material Decoder: BRAND DATA ENTRY ===\n")
    
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Brand_Name", "Short_Profile", "Origin", "Website", "Tech_Support", "Core_Category"])
        print(f"📄 Το αρχείο {OUTPUT_FILE} δημιουργήθηκε επιτυχώς με τις επικεφαλίδες.\n")

    lista_etairiwn = load_brands_from_file(INPUT_FILE)
    if not lista_etairiwn:
        print("🛑 Διακοπή. Το αρχείο εισαγωγής είναι άδειο ή δεν υπάρχει.")
        exit()
        
    print(f"📂 Βρέθηκαν {len(lista_etairiwn)} εταιρείες. Ξεκινάμε!\n")
    
    for brand in lista_etairiwn:
        ai_data = analyze_brand_auto(brand)
        if len(ai_data) == 6:
            save_to_csv(ai_data)
        else:
            print(f"⚠ Πρόβλημα στο brand {brand}. Προχωράμε...\n")
        time.sleep(12)
        
    print("🎉 Η δημιουργία της βάσης των Brands ολοκληρώθηκε!")