import os
import random
from datetime import datetime, timedelta
from app import app, db
from models import User, Pharmacy, Medicine, Inventory, Order, Notification

def seed_database():
    with app.app_context():
        # Ensure instance directory exists
        os.makedirs(os.path.join(app.root_path, 'instance'), exist_ok=True)
        os.makedirs(os.path.join(app.root_path, 'uploads'), exist_ok=True)

        print("Clearing old data...")
        db.drop_all()
        db.create_all()

        print("Creating users...")
        # 1. Admin
        admin = User(
            email='admin@pharmanear.com',
            name='System Administrator',
            role='admin',
            phone='+91 98000 00000'
        )
        admin.set_password('password123')
        db.session.add(admin)

        # 2. Pharmacy Owners
        owner1 = User(
            email='apollo@pharmanear.com',
            name='Rajesh Sharma (Apollo)',
            role='pharmacy_owner',
            phone='+91 98480 12345'
        )
        owner1.set_password('password123')
        db.session.add(owner1)

        owner2 = User(
            email='medplus@pharmanear.com',
            name='Sunita Reddy (MedPlus)',
            role='pharmacy_owner',
            phone='+91 98480 54321'
        )
        owner2.set_password('password123')
        db.session.add(owner2)

        owner3 = User(
            email='wellness@pharmanear.com',
            name='Vikram Verma (Wellness Forever)',
            role='pharmacy_owner',
            phone='+91 98480 99887'
        )
        owner3.set_password('password123')
        db.session.add(owner3)

        # 3. Customers
        customer1 = User(
            email='customer@pharmanear.com',
            name='Ashok Kumar',
            role='customer',
            phone='+91 98765 43210'
        )
        customer1.set_password('password123')
        db.session.add(customer1)

        customer2 = User(
            email='priya@pharmanear.com',
            name='Priya Patel',
            role='customer',
            phone='+91 98765 11223'
        )
        customer2.set_password('password123')
        db.session.add(customer2)

        db.session.commit()

        print("Creating pharmacies in Hyderabad...")
        pharmacies_data = [
            {
                'name': 'Apollo Pharmacy - Banjara Hills',
                'owner_id': owner1.id,
                'license_number': 'TS-HYD-2023-AP01',
                'address': 'Road No. 2, Near Care Hospital, Banjara Hills',
                'city': 'Hyderabad',
                'latitude': 17.4156,
                'longitude': 78.4350,
                'phone': '+91 40 2345 6789',
                'open_hours': '24 Hours Open',
                'rating': 4.8
            },
            {
                'name': 'MedPlus Pharmacy - Jubilee Hills',
                'owner_id': owner2.id,
                'license_number': 'TS-HYD-2022-MP04',
                'address': 'Plot 45, Road No. 36, Jubilee Hills',
                'city': 'Hyderabad',
                'latitude': 17.4325,
                'longitude': 78.4071,
                'phone': '+91 40 2355 8899',
                'open_hours': '7:00 AM - 11:30 PM',
                'rating': 4.7
            },
            {
                'name': 'Wellness Forever - Madhapur IT Corridor',
                'owner_id': owner3.id,
                'license_number': 'TS-HYD-2024-WF12',
                'address': 'Opp. Cyber Towers, Main Road, Madhapur',
                'city': 'Hyderabad',
                'latitude': 17.4483,
                'longitude': 78.3915,
                'phone': '+91 40 4455 6677',
                'open_hours': '24 Hours Open',
                'rating': 4.9
            },
            {
                'name': 'Hetero Pharmacy - Gachibowli',
                'owner_id': None,
                'license_number': 'TS-HYD-2021-HP09',
                'address': 'DLF Cyber City Junction, Gachibowli',
                'city': 'Hyderabad',
                'latitude': 17.4401,
                'longitude': 78.3489,
                'phone': '+91 40 2300 1122',
                'open_hours': '8:00 AM - 11:00 PM',
                'rating': 4.6
            },
            {
                'name': 'Frank Ross Pharmacy - Begumpet',
                'owner_id': None,
                'license_number': 'TS-HYD-2020-FR18',
                'address': 'Sardar Patel Road, Near Rasoolpura Metro, Begumpet',
                'city': 'Hyderabad',
                'latitude': 17.4447,
                'longitude': 78.4664,
                'phone': '+91 40 2780 4321',
                'open_hours': '8:30 AM - 10:30 PM',
                'rating': 4.5
            },
            {
                'name': 'Guardian Pharmacy - Somajiguda',
                'owner_id': None,
                'license_number': 'TS-HYD-2023-GP22',
                'address': 'Raj Bhavan Road, Somajiguda Circle',
                'city': 'Hyderabad',
                'latitude': 17.4260,
                'longitude': 78.4580,
                'phone': '+91 40 2331 5544',
                'open_hours': '8:00 AM - 11:00 PM',
                'rating': 4.4
            },
            {
                'name': 'LifeCare Pharmacy - Kukatpally',
                'owner_id': None,
                'license_number': 'TS-HYD-2022-LC77',
                'address': 'Near KPHB Metro Pillar 782, Kukatpally',
                'city': 'Hyderabad',
                'latitude': 17.4933,
                'longitude': 78.3980,
                'phone': '+91 40 2315 9900',
                'open_hours': '8:00 AM - 11:00 PM',
                'rating': 4.6
            },
            {
                'name': 'Care & Cure Chemist - Secunderabad',
                'owner_id': None,
                'license_number': 'TS-SEC-2021-CC15',
                'address': 'RP Road, Near Clock Tower, Secunderabad',
                'city': 'Hyderabad',
                'latitude': 17.4399,
                'longitude': 78.4983,
                'phone': '+91 40 2770 1234',
                'open_hours': '9:00 AM - 10:00 PM',
                'rating': 4.3
            },
            {
                'name': 'Royal Medicals - Charminar',
                'owner_id': None,
                'license_number': 'TS-HYD-2019-RM03',
                'address': 'Gulzar Houz, Charminar Historical Area',
                'city': 'Hyderabad',
                'latitude': 17.3616,
                'longitude': 78.4747,
                'phone': '+91 40 2452 7890',
                'open_hours': '9:00 AM - 11:00 PM',
                'rating': 4.5
            },
            {
                'name': 'Aster Pharmacy - Kondapur',
                'owner_id': None,
                'license_number': 'TS-HYD-2024-AP88',
                'address': 'Botanical Garden Road, Kondapur',
                'city': 'Hyderabad',
                'latitude': 17.4646,
                'longitude': 78.3562,
                'phone': '+91 40 2988 3344',
                'open_hours': '8:00 AM - Midnight',
                'rating': 4.8
            },
            {
                'name': 'Sri Sai Medical Store - Ameerpet',
                'owner_id': None,
                'license_number': 'TS-HYD-2020-SS44',
                'address': 'Beside Metro Station, Ameerpet Cross Roads',
                'city': 'Hyderabad',
                'latitude': 17.4375,
                'longitude': 78.4483,
                'phone': '+91 40 2374 8811',
                'open_hours': '8:30 AM - 11:00 PM',
                'rating': 4.4
            },
            {
                'name': 'MaxCare Drug House - Dilsukhnagar',
                'owner_id': None,
                'license_number': 'TS-HYD-2021-MC55',
                'address': 'Main Road, Near Konark Theatre, Dilsukhnagar',
                'city': 'Hyderabad',
                'latitude': 17.3688,
                'longitude': 78.5247,
                'phone': '+91 40 2405 6677',
                'open_hours': '8:00 AM - 10:30 PM',
                'rating': 4.5
            }
        ]

        pharmacy_objs = []
        for p in pharmacies_data:
            pharm = Pharmacy(**p)
            db.session.add(pharm)
            pharmacy_objs.append(pharm)

        db.session.commit()

        print("Creating catalog of 60+ medicines...")
        medicines_data = [
            # Pain & Fever
            ("Dolo 650 Tablet", "Paracetamol 650mg", "Pain & Fever", "650mg", "Micro Labs", False, "Effective relief from fever, body ache, mild to moderate headache and arthritis pain.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Crocin 650 Tablet", "Paracetamol 650mg", "Pain & Fever", "650mg", "GlaxoSmithKline", False, "Fast acting paracetamol for fever and pain relief.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Brufen 400 Tablet", "Ibuprofen 400mg", "Pain & Fever", "400mg", "Abbott India", False, "NSAID for reducing inflammation, dental pain, and muscular pain.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Combiflam Tablet", "Ibuprofen + Paracetamol", "Pain & Fever", "400mg+325mg", "Sanofi India", False, "Dual-action combination for intense pain, headache, and joint sprains.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Zerodol-P Tablet", "Aceclofenac + Paracetamol", "Pain & Fever", "100mg+325mg", "Ipca Labs", True, "Potent analgesic for osteoarthritis, rheumatoid arthritis and back pain.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Meftal-Spas Tablet", "Mefenamic Acid + Dicyclomine", "Pain & Fever", "250mg+10mg", "Blue Cross", True, "Anti-spasmodic for menstrual cramps, stomach pain, and colic.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Disprin Effervescent 325mg", "Aspirin 325mg", "Pain & Fever", "325mg", "Reckitt Benckiser", False, "Fast dissolving painkiller for immediate headache and migraine relief.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Ultracet Tablet", "Tramadol + Paracetamol", "Pain & Fever", "37.5mg+325mg", "Janssen-Cilag", True, "Prescription pain medicine for moderate to severe post-surgery pain.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),

            # Antibiotics
            ("Augmentin 625 Duo", "Amoxicillin + Clavulanic Acid", "Antibiotics", "500mg+125mg", "GSK", True, "Broad-spectrum penicillin antibiotic for ear, throat, chest and urinary infections.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Azithral 500 Tablet", "Azithromycin 500mg", "Antibiotics", "500mg", "Alembic Pharma", True, "Macrolide antibiotic for respiratory tract infections and tonsillitis.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Taxim-O 200 Tablet", "Cefixime 200mg", "Antibiotics", "200mg", "Alkem Labs", True, "Cephalosporin antibiotic for typhoid, bronchitis, and UTI.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Ciplox 500 Tablet", "Ciprofloxacin 500mg", "Antibiotics", "500mg", "Cipla Ltd", True, "Fluoroquinolone antibiotic for bacterial skin and gastrointestinal infections.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Doxy-100 Capsule", "Doxycycline 100mg", "Antibiotics", "100mg", "Dr. Reddy's", True, "Tetracycline antibiotic for acne, chlamydia, and bacterial chest infections.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Metrogyl 400 Tablet", "Metronidazole 400mg", "Antibiotics", "400mg", "J.B. Chemicals", True, "Used for amoebic dysentery, dental infections, and pelvic infections.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),
            ("Moxikind-CV 625", "Amoxicillin + Potassium Clavulanate", "Antibiotics", "625mg", "Mankind Pharma", True, "Antibacterial formulation for resistant strains of bacteria.", "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300"),

            # Gastrointestinal & Acidity
            ("Pan 40 Tablet", "Pantoprazole 40mg", "Gastrointestinal", "40mg", "Alkem Labs", False, "Proton pump inhibitor for GERD, acid reflux, and stomach ulcers.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Omez 20 Capsule", "Omeprazole 20mg", "Gastrointestinal", "20mg", "Dr. Reddy's", False, "Reduces excessive stomach acid, heartburn, and sour burps.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Razo 20 Tablet", "Rabeprazole 20mg", "Gastrointestinal", "20mg", "Dr. Reddy's", False, "Fast acting acid blocker for acute gastritis and peptic ulcers.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Digene Mint Gel 200ml", "Aluminium + Magnesium Hydroxide", "Gastrointestinal", "200ml", "Abbott", False, "Cooling antacid syrup providing instantaneous heartburn relief.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Gelusil Liquid 200ml", "Aluminium Hydroxide + Simethicone", "Gastrointestinal", "200ml", "Pfizer", False, "Antacid and anti-gas formula for bloating and acidity.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Emeset 4mg Tablet", "Ondansetron 4mg", "Gastrointestinal", "4mg", "Cipla", True, "Prevents and treats nausea, vomiting and stomach upset.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Eno Fruit Salt (Lemon)", "Sodium Bicarbonate + Citric Acid", "Gastrointestinal", "100g", "GSK", False, "Fast acting effervescent antacid relieves acidity in 6 seconds.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),
            ("Cremaffin Mixed Fruit 225ml", "Liquid Paraffin + Milk of Magnesia", "Gastrointestinal", "225ml", "Abbott", False, "Gentle stool softener and laxative for constipation.", "https://images.unsplash.com/photo-1550572017-ed200f5e6343?w=300"),

            # Respiratory & Allergy
            ("Montair-LC Tablet", "Montelukast 10mg + Levocetirizine 5mg", "Respiratory & Allergy", "10mg+5mg", "Cipla", True, "For allergic rhinitis, runny nose, sneezing, and chronic asthma prophylaxis.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Allegra 120mg Tablet", "Fexofenadine 120mg", "Respiratory & Allergy", "120mg", "Sanofi", False, "Non-drowsy 24hr antihistamine for seasonal hay fever and hives.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Cetzine 10mg Tablet", "Cetirizine 10mg", "Respiratory & Allergy", "10mg", "Dr. Reddy's", False, "Classic antihistamine for allergic itching, cold symptoms and watery eyes.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Ascoril LS Syrup 100ml", "Levosalbutamol + Ambroxol + Guaifenesin", "Respiratory & Allergy", "100ml", "Glenmark", True, "Productive cough syrup relieves chest congestion and opens airways.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Benadryl Dry Cough Syrup", "Dextromethorphan + Chlorpheniramine", "Respiratory & Allergy", "100ml", "Johnson & Johnson", False, "Soothing formula for dry, tickly throat and irritating cough.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Asthalin Inhaler 100mcg", "Salbutamol 100mcg", "Respiratory & Allergy", "200 doses", "Cipla", True, "Quick relief bronchodilator inhaler for sudden asthma attacks and breathlessness.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Budecort 200 Inhaler", "Budesonide 200mcg", "Respiratory & Allergy", "200 doses", "Cipla", True, "Inhaled corticosteroid for daily asthma and COPD maintenance.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Otrivin Oxy Nasal Spray", "Oxymetazoline 0.05%", "Respiratory & Allergy", "10ml", "GSK", False, "Fast acting nasal decongestant opens blocked nose in 25 seconds.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),

            # Cardiovascular & Hypertension
            ("Telma 40 Tablet", "Telmisartan 40mg", "Cardiovascular", "40mg", "Glenmark", True, "Angiotensin receptor blocker for hypertension and cardiovascular risk reduction.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Amlong 5 Tablet", "Amlodipine 5mg", "Cardiovascular", "5mg", "Micro Labs", True, "Calcium channel blocker for lowering elevated blood pressure and angina pectoris.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Atorva 20 Tablet", "Atorvastatin 20mg", "Cardiovascular", "20mg", "Zydus Cadila", True, "Statin medication for lowering bad LDL cholesterol and triglycerides.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Rosuvas 10 Tablet", "Rosuvastatin 10mg", "Cardiovascular", "10mg", "Sun Pharma", True, "High efficacy statin for hypercholesterolemia management.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Betaloc 25mg Tablet", "Metoprolol Succinate 25mg", "Cardiovascular", "25mg", "AstraZeneca", True, "Beta-blocker for stabilizing heart rate, hypertension and angina.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Ecosprin 75 Tablet", "Aspirin 75mg Gastro-resistant", "Cardiovascular", "75mg", "USV Ltd", True, "Antiplatelet blood thinner prevents heart attacks and stroke recurrence.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),
            ("Telma-AM Tablet", "Telmisartan 40mg + Amlodipine 5mg", "Cardiovascular", "40mg+5mg", "Glenmark", True, "Combination blood pressure medication for resistant hypertension.", "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300"),

            # Diabetes
            ("Glycomet 500 SR", "Metformin 500mg Sustained Release", "Diabetes", "500mg", "USV Ltd", True, "First-line oral antidiabetic drug improving insulin sensitivity in Type-2 diabetes.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Glycomet GP 1", "Glimepiride 1mg + Metformin 500mg", "Diabetes", "1mg+500mg", "USV Ltd", True, "Dual oral hypoglycemic agent for blood sugar regulation.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Amaryl 2mg Tablet", "Glimepiride 2mg", "Diabetes", "2mg", "Sanofi", True, "Sulfonylurea stimulates pancreas to produce more natural insulin.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Jardiance 10mg", "Empagliflozin 10mg", "Diabetes", "10mg", "Boehringer Ingelheim", True, "SGLT2 inhibitor eliminates excess glucose through urine with cardio benefits.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Januvia 100mg Tablet", "Sitagliptin 100mg", "Diabetes", "100mg", "MSD", True, "DPP-4 inhibitor enhances incretin hormones to stabilize glucose levels.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Galvus Met 50/500", "Vildagliptin 50mg + Metformin 500mg", "Diabetes", "50mg+500mg", "Novartis", True, "Effective combination for glycemic control in adult Type 2 diabetics.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),

            # Vitamins, Minerals & Supplements
            ("Limcee 500mg Chewable", "Vitamin C (Ascorbic Acid)", "Vitamins & Supplements", "500mg", "Abbott", False, "Immunity booster, collagen formation and antioxidant chewable orange tablet.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Calcirol 60000 IU Sachet", "Cholecalciferol (Vitamin D3)", "Vitamins & Supplements", "60000 IU", "Cadila", False, "High-dose Vitamin D3 granule sachet for bone strength, calcium absorption and immunity.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Neurobion Forte Tablet", "Vitamin B Complex with B12", "Vitamins & Supplements", "Standard", "Procter & Gamble", False, "Supports nerve health, prevents tingling/numbness and boosts energy metabolism.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Zincovit Tablet", "Multivitamins + Multiminerals + Zinc", "Vitamins & Supplements", "Standard", "Apex Labs", False, "Daily multivitamin tablet improving stamina, tissue repair and immune defenses.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Becosules Capsules", "Vitamin B-Complex with Vitamin C", "Vitamins & Supplements", "Standard", "Pfizer", False, "Renowned supplement for mouth ulcers, fatigue, and hair/skin health.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Shelcal 500 Tablet", "Calcium 500mg + Vitamin D3 250IU", "Vitamins & Supplements", "500mg+250IU", "Torrent Pharma", False, "Strengthens bones and teeth, essential during pregnancy and for osteoporosis prevention.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Supradyn Daily Tablet", "Multivitamin with Minerals and Trace Elements", "Vitamins & Supplements", "Standard", "Bayer", False, "Complete daily nourishment formula for active lifestyle and vitality.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Evion 400 Capsule", "Vitamin E (Tocopheryl Acetate)", "Vitamins & Supplements", "400mg", "Merck", False, "Nourishing antioxidant capsule promoting healthy skin, hair and muscular strength.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),

            # First Aid & Topical
            ("Betadine 10% Ointment 20g", "Povidone Iodine 10% w/w", "First Aid & Topical", "20g", "Win-Medicare", False, "Antiseptic microbicidal ointment for cuts, burns, wounds, and skin infections.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Soframycin Skin Cream 30g", "Framycetin Sulfate 1%", "First Aid & Topical", "30g", "Sanofi", False, "Antibacterial topical cream for minor burns, scrapes and boils.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Volini Pain Relief Gel 50g", "Diclofenac + Methyl Salicylate + Menthol", "First Aid & Topical", "50g", "Sun Pharma", False, "Deep penetrating topical gel for quick back, neck, shoulder and joint pain relief.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Moov Pain Relief Spray 80g", "Eucalyptus Oil + Wintergreen Oil", "First Aid & Topical", "80g", "Reckitt Benckiser", False, "100% natural active ingredients aerosol spray for fast backache relief.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Candid Powder 100g", "Clotrimazole 1% w/w", "First Aid & Topical", "100g", "Glenmark", False, "Medicated antifungal dusting powder for prickly heat, fungal rashes and sweat chafing.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300"),
            ("Burnol Ointment 20g", "Aminacrine + Cetrimide", "First Aid & Topical", "20g", "Morepen Labs", False, "Specialized burn cream prevents infection and reduces pain on minor kitchen burns.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300")
        ]

        medicine_objs = []
        for name, gen, cat, dos, mfg, rx, desc, img in medicines_data:
            med = Medicine(
                name=name,
                generic_name=gen,
                category=cat,
                dosage=dos,
                manufacturer=mfg,
                prescription_required=rx,
                description=desc,
                image_url=img
            )
            db.session.add(med)
            medicine_objs.append(med)

        db.session.commit()

        print("Populating inventory across pharmacies...")
        # Baseline price table per medicine index
        base_prices = [
            30.0, 32.0, 42.0, 48.0, 75.0, 52.0, 18.0, 115.0, # Pain
            195.0, 120.0, 110.0, 55.0, 68.0, 38.0, 185.0,     # Antibiotics
            88.0, 58.0, 92.0, 140.0, 135.0, 45.0, 10.0, 160.0,# GI
            175.0, 145.0, 42.0, 110.0, 105.0, 180.0, 240.0, 85.0, # Resp
            125.0, 45.0, 165.0, 195.0, 88.0, 15.0, 140.0,    # Cardio
            28.0, 65.0, 78.0, 390.0, 420.0, 210.0,             # Diabetes
            25.0, 95.0, 38.0, 115.0, 45.0, 130.0, 62.0, 48.0,  # Vitamins
            68.0, 58.0, 135.0, 160.0, 145.0, 48.0              # First Aid
        ]

        today = datetime.now()

        for p_idx, pharm in enumerate(pharmacy_objs):
            # Each pharmacy stocks 70% - 95% of all catalog medicines
            for m_idx, med in enumerate(medicine_objs):
                # Always stock popular medicines, randomly decide others
                if m_idx < 10 or random.random() < 0.85:
                    base = base_prices[m_idx % len(base_prices)]
                    # Price variation between 85% to 110% across pharmacies
                    markup = random.uniform(0.90, 1.15)
                    price = round(base * markup, 2)
                    discount = round(price * 0.90, 2) if random.random() < 0.4 else None

                    # Stock quantities: include a few low stocks to demonstrate low-stock alerts
                    if random.random() < 0.12:
                        stock = random.randint(2, 8)  # Low stock trigger!
                    else:
                        stock = random.randint(25, 180)

                    # Expiry dates: include a few near-expiry items to demonstrate expiry alerts
                    if random.random() < 0.08:
                        exp_days = random.randint(15, 45)  # Near expiry alert!
                    else:
                        exp_days = random.randint(180, 720)
                    exp_date = (today + timedelta(days=exp_days)).strftime('%Y-%m-%d')

                    batch = f"BTH-{random.randint(1000, 9999)}-{chr(65 + (m_idx % 26))}"

                    inv = Inventory(
                        pharmacy_id=pharm.id,
                        medicine_id=med.id,
                        price=price,
                        discount_price=discount,
                        stock_quantity=stock,
                        batch_number=batch,
                        expiry_date=exp_date
                    )
                    db.session.add(inv)

        db.session.commit()

        print("Creating sample orders and reservations...")
        # 1. Recent confirmed order for customer1
        order1 = Order(
            order_number='ORD-20261015-001',
            user_id=customer1.id,
            pharmacy_id=pharmacy_objs[0].id,
            order_type='order',
            status='confirmed',
            total_amount=225.00,
            notes='Please deliver between 5-7 PM.'
        )
        order1.set_items([
            {'medicine_id': medicine_objs[0].id, 'medicine_name': 'Dolo 650 Tablet', 'quantity': 2, 'unit_price': 30.0},
            {'medicine_id': medicine_objs[40].id, 'medicine_name': 'Limcee 500mg Chewable', 'quantity': 3, 'unit_price': 25.0},
            {'medicine_id': medicine_objs[24].id, 'medicine_name': 'Allegra 120mg Tablet', 'quantity': 1, 'unit_price': 90.0}
        ])
        db.session.add(order1)

        # 2. Ready for pickup reservation for customer1
        res1 = Order(
            order_number='RES-20261015-002',
            user_id=customer1.id,
            pharmacy_id=pharmacy_objs[1].id,
            order_type='reservation',
            status='ready_for_pickup',
            total_amount=195.00,
            notes='Will pick up in the evening after office.'
        )
        res1.set_items([
            {'medicine_id': medicine_objs[8].id, 'medicine_name': 'Augmentin 625 Duo', 'quantity': 1, 'unit_price': 195.0}
        ])
        db.session.add(res1)

        # 3. Completed order for customer2
        order2 = Order(
            order_number='ORD-20261014-003',
            user_id=customer2.id,
            pharmacy_id=pharmacy_objs[2].id,
            order_type='order',
            status='completed',
            total_amount=385.00,
            notes='Delivered successfully.'
        )
        order2.set_items([
            {'medicine_id': medicine_objs[32].id, 'medicine_name': 'Glycomet 500 SR', 'quantity': 5, 'unit_price': 28.0},
            {'medicine_id': medicine_objs[27].id, 'medicine_name': 'Telma 40 Tablet', 'quantity': 2, 'unit_price': 122.5}
        ])
        db.session.add(order2)

        # 4. Pending reservation for customer1 at Apollo
        res2 = Order(
            order_number='RES-20261015-004',
            user_id=customer1.id,
            pharmacy_id=pharmacy_objs[0].id,
            order_type='reservation',
            status='pending',
            total_amount=135.00,
            notes='Reserve for next 24 hours.'
        )
        res2.set_items([
            {'medicine_id': medicine_objs[53].id, 'medicine_name': 'Volini Pain Relief Gel 50g', 'quantity': 1, 'unit_price': 135.0}
        ])
        db.session.add(res2)

        # Create notifications
        notif1 = Notification(
            user_id=customer1.id,
            title='Reservation Confirmed',
            message='Your reservation RES-20261015-002 is ready for pickup at MedPlus Pharmacy - Jubilee Hills.'
        )
        notif2 = Notification(
            user_id=owner1.id,
            title='New Order Received',
            message='New reservation RES-20261015-004 received from Ashok Kumar.'
        )
        notif3 = Notification(
            user_id=owner1.id,
            title='Low Stock Alert',
            message='3 medicines in your inventory are running below threshold (under 10 units).'
        )
        db.session.add_all([notif1, notif2, notif3])

        db.session.commit()

        print("\n=======================================================")
        print("SEEDING COMPLETED SUCCESSFULLY!")
        print("=======================================================")
        print(f"Users created: {User.query.count()}")
        print(f"Pharmacies created: {Pharmacy.query.count()}")
        print(f"Medicines cataloged: {Medicine.query.count()}")
        print(f"Inventory records: {Inventory.query.count()}")
        print(f"Orders & Reservations: {Order.query.count()}")
        print("-------------------------------------------------------")
        print("DEMO CREDENTIALS:")
        print("Customer:        customer@pharmanear.com  / password123")
        print("Pharmacy Owner:  apollo@pharmanear.com    / password123")
        print("Admin:           admin@pharmanear.com     / password123")
        print("=======================================================")

if __name__ == '__main__':
    seed_database()
