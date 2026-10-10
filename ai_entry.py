import csv
import time
import requests
import os

# --- 1. ΡΥΘΜΙΣΕΙΣ & API KEY ---
API_KEY = "AQ.Ab8RN6Lk9H_glF8A1w-P7g-Ud794ZYL53aX_8RJ1_-m8ZEpQaw"
INPUT_FILE = "input.txt"
OUTPUT_FILE = "materials.csv"

def load_materials_from_file(filename):
    if not os.path.exists(filename):
        print(f"❌ Το αρχείο '{filename}' δεν βρέθηκε! Φτιάξε ένα αρχείο με αυτό το όνομα και βάλε τα υλικά σου.")
        return []
    
    with open(filename, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]
    return lines

def analyze_material_auto(product_name):
    print(f"⏳ Αναζήτηση στοιχείων και τιμής για: '{product_name}'...")
    
    prompt = f"""
    Είσαι κορυφαίος πολιτικός μηχανικός. Βρες από τη βάση δεδομένων σου τα τεχνικά χαρακτηριστικά για το εμπορικό δομικό υλικό: '{product_name}'.
    
    Εξήγαγε και δημιούργησε τα εξής δεδομένα, χωρισμένα ΑΥΣΤΗΡΑ με το σύμβολο | (και χωρίς αλλαγές γραμμής ανάμεσα τους):
    Name | Category | Ingredients | Mechanism | Applications | Incompatibilities | Price | Info_Cosmetics | Info_Craftsman | Info_Cooking | Info_Cars | Info_Bio | Info_Tech | Info_Gaming
    
    Οδηγίες:
    - Το Name πρέπει να είναι ακριβώς: {product_name}
    - Στο Price, δώσε μια ενδεικτική μέση τιμή αγοράς (π.χ. 15-20€ / σακί 25kg). Αν δεν υπάρχει καθόλου εκτίμηση, γράψε 'Κατόπιν ζήτησης'.
    - Στα 'Info_', γράψε έξυπνες, στοχευμένες αναλογίες (1 πρόταση το καθένα) για να εξηγήσεις τον μηχανισμό.
    - ΜΗΝ βάλεις επικεφαλίδες, markdown ή περιττό κείμενο. Επέστρεψε ΜΟΝΟ τα 14 πεδία χωρισμένα με |.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={API_KEY}"
    headers = {'Content-Type': 'application/json'}
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    for attempt in range(3):
        try:
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                clean_text = result['candidates'][0]['content']['parts'][0]['text'].strip().replace('\n', '')
                columns = [item.strip() for item in clean_text.split('|')]
                
                while len(columns) < 14:
                    columns.append("N/A")
                return columns[:14]
                
            elif response.status_code == 503:
                print(f"🔄 Υπερφόρτωση Google (503). Αυτόματη αναμονή 15 δευτερόλεπτα... ({attempt+1}/3)")
                time.sleep(15)
            else:
                print(f"❌ Σφάλμα {response.status_code} από Google: {response.text}")
                return []
        except Exception as e:
            print(f"❌ Σφάλμα σύνδεσης: {e}")
            return []
            
    print(f"❌ Αποτυχία μετά από 3 προσπάθειες για το {product_name}.")
    return []

def save_to_csv(data_list, filename=OUTPUT_FILE):
    try:
        with open(filename, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(data_list)
        print(f"✅ Επιτυχία! Το {data_list[0]} αποθηκεύτηκε στο {filename}.\n")
    except Exception as e:
        print(f"❌ Σφάλμα κατά την αποθήκευση: {e}")

# --- 2. ΕΚΤΕΛΕΣΗ ΜΑΖΙΚΗΣ ΔΙΑΔΙΚΑΣΙΑΣ ---
if __name__ == "__main__":
    print("=== 🚀 Material Decoder: MASSIVE AUTO DATA ENTRY (WITH PRICES) ===\n")

    # Προσθήκη: Δημιουργία του CSV με τις 14 επικεφαλίδες αν δεν υπάρχει
    if not os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(["Name", "Brand", "Ingredients", "Mechanism", "Application", "Incompatibilities", "Category", "Metaphor_1", "Metaphor_2", "Metaphor_3", "Metaphor_4", "Metaphor_5", "Website", "Price"])
            print(f"📄 Το αρχείο {OUTPUT_FILE} δημιουργήθηκε επιτυχώς με τις επικεφαλίδες.\n")

    # --- ΝΕΟΣ ΚΩΔΙΚΑΣ: Έξυπνη Μνήμη & Λούπα ---
    existing_materials = set()
    
    # Διαβάζουμε τι υπάρχει ήδη στο materials.csv
    try:
        with open(OUTPUT_FILE, mode='r', encoding='utf-8') as csv_file:
            reader = csv.reader(csv_file)
            next(reader, None)  # Προσπερνάμε τις επικεφαλίδες
            for row in reader:
                if row:
                    existing_materials.add(row[0].strip().lower())
    except FileNotFoundError:
        pass

    # Διαβάζουμε τη λίστα από το input.txt
    with open(INPUT_FILE, mode='r', encoding='utf-8') as txt_file:
        material_names = txt_file.readlines()

    print("\n🚀 Ξεκινάει ο έλεγχος και η εισαγωγή νέων υλικών...")

    for name in material_names:
        clean_name = name.strip()
        if not clean_name:
            continue
            
        # Αν υπάρχει ήδη, το προσπερνάμε αστραπιαία!
        if clean_name.lower() in existing_materials:
            print(f"⏩ Προσπέραση: Το υλικό '{clean_name}' υπάρχει ήδη.")
            continue
            
        print(f"\n⏳ Επεξεργασία νέου υλικού: {clean_name}")
        
        # Καλούμε το AI
        new_data = analyze_material_auto(clean_name)
        
        if new_data:
            # Χρησιμοποιούμε τη δική σου συνάρτηση αποθήκευσης που βρίσκεται στη γραμμή 68
            save_to_csv(new_data, OUTPUT_FILE)
            # Περιμένουμε 15 δευτερόλεπτα για να μην φάμε block
            time.sleep(15)
    
    if not lista_ylikon:
        print("🛑 Διακοπή. Το αρχείο input είναι άδειο ή δεν υπάρχει.")
        exit()
        
    print(f"📂 Βρέθηκαν {len(lista_ylikon)} υλικά προς επεξεργασία. Ξεκινάμε!\n")
    
    for yliko in lista_ylikon:
        ai_data = analyze_material_auto(yliko)
        
        if len(ai_data) == 14:
            save_to_csv(ai_data)
        else:
            print(f"⚠ Πρόβλημα στο {yliko}. Προχωράμε στο επόμενο...\n")
            
        time.sleep(12) 
        
    print("🎉 Η μαζική εισαγωγή Data Entry ολοκληρώθηκε!")