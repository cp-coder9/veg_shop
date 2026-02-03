import re
import json

def parse_google_form():
    with open('form_data.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the FB_PUBLIC_LOAD_DATA_ variable
    match = re.search(r'var FB_PUBLIC_LOAD_DATA_ = (.*?);</script>', content, re.DOTALL)
    if not match:
        print("Could not find form data.")
        return

    data_str = match.group(1)
    try:
        data = json.loads(data_str)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return

    # Google Forms structure is deeply nested lists.
    # Products are usually in data[1][1]
    items = []
    
    def find_items(obj):
        if isinstance(obj, list):
            # Check if this list node looks like a question item
            # Format: [id, "Item Name - R Price", ...]
            if len(obj) >= 4 and isinstance(obj[1], str) and isinstance(obj[3], list):
                # This might be a section header or a multi-choice item
                pass
            
            # Looking for strings that have - R followed by numbers
            for sub in obj:
                if isinstance(sub, str) and ' - R' in sub:
                    items.append(sub)
                else:
                    find_items(sub)
        elif isinstance(obj, dict):
            for val in obj.values():
                find_items(val)

    find_items(data)
    
    # Clean up and deduplicate
    products = []
    seen = set()
    for item in items:
        # Match "Name - RPrice" or "Name - R Price"
        # Some items might be "Price per kg" etc.
        if item in seen: continue
        seen.add(item)
        
        parts = item.split(' - R')
        if len(parts) >= 2:
            name = parts[0].strip()
            # Clean up the name (sometimes it has leading junk)
            name = name.split('\n')[-1].strip()
            
            price_str = parts[1].strip().split(' ')[0]
            # Remove any non-numeric from price_str except dots
            price_str = re.sub(r'[^\d.]', '', price_str)
            
            try:
                price = float(price_str)
                products.append({"name": name, "price": price})
            except:
                products.append({"name": name, "price": 0.0, "raw_price": price_str})

    print(json.dumps(products, indent=2))

if __name__ == "__main__":
    parse_google_form()
