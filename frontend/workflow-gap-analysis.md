# Workflow Gap Analysis: Target vs. Current Implementation

This document provides a gap analysis comparing the workflow requirements provided by Sasha with the currently implemented functionality in the Organic Vegetable Order Management System. 

---

### 1. Terms & Conditions (T&C's)
* **Target Workflow:** Sasha to create T&C's.
* **Current Implementation:** No T&C feature is currently coded.
* **Gap / Action Required:** Provide the T&C text so a standard "Terms & Conditions" page and a "I agree to the T&C's" checkbox can be added at checkout.

---

### 2. Order Allocation by Area
* **Target Workflow:** Orders allocated by area based on their address or collection.
* **Current Implementation:** Orders have an address and delivery method, but are not grouped or allocated into specific "Delivery Areas" or routes automatically.
* **Gap / Action Required:** Backend and frontend logic needs to be introduced to tag orders into "Areas" (e.g., matching address zip codes or manually drawn polygons) and group the driver/packer manifests by these Areas.

---

### 3. Admin Allocation of Driver and Packer
* **Target Workflow:** Admin to allocate driver and packer to area / collection.
* **Current Implementation:** The database and backend API technically support assigning a `driverId` and `packerId` to an order. However, the Admin Dashboard UI (`OrdersManagement`) currently lacks any interface to actually assign these roles.
* **Gap / Action Required:** Add an "Assignment" interface in the Admin Dashboard to bulk-select orders or areas and attach specific staff members (Driver/Packer) to them. 

---

### 4. Dynamic Personnel Reallocation
* **Target Workflow:** Packers and drivers to be able to change on the day according to times and conditions etc.
* **Current Implementation:** Because the Admin UI doesn't have assignment functionality, dynamic daily re-assignment is not possible via the UI.
* **Gap / Action Required:** The assignment interface built for #3 must allow quick bulk-reassignment of orders/areas on the fly. 

---

### 5. Packer Finalization Restriction
* **Target Workflow:** Packer can *only* finalise an order once fully collected.
* **Current Implementation:** Packers currently *can* finalize short deliveries. If an item is missing, the system prompts: *"Some items are short-packed... Proceed?"* and finalizing is allowed if the packer clicks OK.
* **Gap / Action Required:** Disable the "Complete Packing" button entirely if any item is not marked as packed. This will require a separate process or admin override to handle legitimate short deliveries, to align with the strict "only finalise once fully collected" rule.

---

### 6. Sasha 2-Step Picking Process
* **Target Workflow:** Sasha 2 step picking (packed into cooler boxes and bags & then picked out of cooler box and order finalised)
* **Current Implementation:** The Packer Dashboard groups items by type (cold, ambient, frozen) but uses a simple one-step checkbox (`toggleItemPacked`). There are no distinct workflow states for "prepared into cooler box" vs. "finalised order/picked out".
* **Gap / Action Required:** Redesign the Packer UI to have two distinct tabs or checklist stages: 
  1. **Prep Stage:** Pack perishable items into cooler boxes/bags.
  2. **Finalization Stage:** Pick boxes and ambient goods together to finalize the order. 

---

### 7. Packer-Driver Handover Confirmation
* **Target Workflow:** Packer & Driver confirm if packed and what the driver should deliver (e.g., bag / cooler box items / eggs).
* **Current Implementation:** The Driver Dashboard has an aggregated manifest summary (`summaryItems`), but there is no explicit handshake, sign-off, or physical handover sequence in the app requiring both parties to confirm the package composition (like eggs/fragiles).
* **Gap / Action Required:** Create a "Handover View" in both the Packer and Driver dashboards showing precise package units (e.g., "3 Ambient Bags, 1 Cooler Box, 1 Egg Carton"). Implement a digital handshake (e.g., Driver clicks "Accept Manifest").

---

### 8. Delivery Finalization Options
* **Target Workflow:** Driver to finalise delivery - and confirm if handed to client, left at door, or placed inside.
* **Current Implementation:** The `DriverDashboard` allows the driver to confirm "Handed to Client" or "Left at Door". 
* **Gap / Action Required:** Add a third status button for "Placed Inside" (e.g., fridge deliveries or inside gated paths). Update the backend order status enum if necessary. 
