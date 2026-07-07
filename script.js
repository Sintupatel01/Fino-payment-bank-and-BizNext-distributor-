let dynamicCategoryFilter = 'all';
let isAdminActive = false;

function getSecurityCode() {
    let activeCode = localStorage.getItem('distributorSecureKey');
    if(!activeCode) {
        localStorage.setItem('distributorSecureKey', '1234');
        return '1234';
    }
    return activeCode;
}

function filterCategory(category, element) {
    dynamicCategoryFilter = category;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    filterServices();
}

function filterServices() {
    const searchQuery = document.getElementById('serviceSearch').value.toLowerCase();
    const cards = document.querySelectorAll('#servicesGrid .card');
    cards.forEach(card => {
        const cardText = card.innerText.toLowerCase();
        const cardCategory = card.getAttribute('data-category');
        if (cardText.includes(searchQuery) && (dynamicCategoryFilter === 'all' || cardCategory === dynamicCategoryFilter)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

function handleFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobileNumber').value.trim();
    const shop = document.getElementById('shopName').value.trim();
    const notes = document.getElementById('identityDoc').value.trim();

    const textMessagePattern = `*New Fino/BizNext Retailer Registration Request*\n\n` +
                               `• *Name:* ${name}\n` +
                               `• *Mobile:* ${mobile}\n` +
                               `• *Shop Name:* ${shop}\n` +
                               `• *Remarks:* ${notes || 'None'}`;

    const registrationPayload = {
        id: Date.now(),
        name: name,
        mobile: mobile,
        shop: shop,
        status: 'Pending Verification'
    };

    let localRecords = localStorage.getItem('retailerSubmissions');
    let recordsArray = localRecords ? JSON.parse(localRecords) : [];
    recordsArray.push(registrationPayload);
    localStorage.setItem('retailerSubmissions', JSON.stringify(recordsArray));

    document.getElementById('retailerForm').reset();
    renderTableData();

    const whatsappUrl = `https://wa.me/918840478932?text=${encodeURIComponent(textMessagePattern)}`;
    window.location.href = whatsappUrl;
}

// Separate function handler to handle dynamic device purchasing orders instantly
function orderProduct(productName) {
    const productOrderMessage = `*Fino/BizNext Portal - Product Purchase Inquiry*\n\n` +
                                 `Hello Sintu Patel, I want to buy the following product from your distribution branch:\n\n` +
                                 `• *Product:* ${productName}\n\n` +
                                 `Please share the price list and dynamic shipping details. Thanks!`;
    
    const whatsappProductUrl = `https://wa.me/918840478932?text=${encodeURIComponent(productOrderMessage)}`;
    window.location.href = whatsappProductUrl;
}

function loginAdminSecretDoor() {
    const systemPassword = getSecurityCode();
    const passwordAttempt = prompt("Enter Secret Distributor Portal Door Security Code:");
    
    if(passwordAttempt === systemPassword) {
        isAdminActive = true;
        document.getElementById('adminControls').style.display = "block";
        document.getElementById('actionHeader').style.display = "table-cell";
        alert("Access Granted. Secure Session Active.");
        renderTableData();
    } else {
        alert("Unauthorized Entry Attempt: Access Denied.");
    }
}

function changeSystemPassword() {
    if(!isAdminActive) return;
    
    const currentSystemKey = getSecurityCode();
    const oldPassVerify = prompt("Verify current Security Code to proceed:");
    
    if(oldPassVerify !== currentSystemKey) {
        alert("Verification Failed: Incorrect code entered.");
        return;
    }
    
    const newSecurityKey = prompt("Enter your NEW Security Code:");
    if(!newSecurityKey || newSecurityKey.trim().length === 0) {
        alert("Error: Password cannot be empty.");
        return;
    }
    
    localStorage.setItem('distributorSecureKey', newSecurityKey.trim());
    alert("Success: Security Code updated successfully. Please remember your new login key.");
    logoutAdmin();
}

function logoutAdmin() {
    isAdminActive = false;
    document.getElementById('adminControls').style.display = "none";
    document.getElementById('actionHeader').style.display = "none";
    renderTableData();
}

function updateStatus(recordId, newStatus) {
    let localRecords = localStorage.getItem('retailerSubmissions');
    if(localRecords) {
        let recordsArray = JSON.parse(localRecords);
        recordsArray = recordsArray.map(item => {
            if(item.id === recordId) item.status = newStatus;
            return item;
        });
        localStorage.setItem('retailerSubmissions', JSON.stringify(recordsArray));
        renderTableData();
    }
}

function deleteRecord(recordId) {
    if(confirm("Are you sure you want to completely drop this application data instance entry?")) {
        let localRecords = localStorage.getItem('retailerSubmissions');
        if(localRecords) {
            let recordsArray = JSON.parse(localRecords);
            recordsArray = recordsArray.filter(item => item.id !== recordId);
            localStorage.setItem('retailerSubmissions', JSON.stringify(recordsArray));
            renderTableData();
        }
    }
}

function renderTableData() {
    const tableBody = document.getElementById('dataTableBody');
    let localRecords = localStorage.getItem('retailerSubmissions');
    let recordsArray = localRecords ? JSON.parse(localRecords) : [];

    tableBody.innerHTML = "";

    if(recordsArray.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${isAdminActive ? 5 : 4}" style="text-align:center; color:#999;">No records registered in local database panel yet.</td></tr>`;
        return;
    }

    recordsArray.forEach(record => {
        const row = document.createElement('tr');
        let statusColor = '#ff9900'; 
        if(record.status === 'Approved') statusColor = '#25D366';
        if(record.status === 'Rejected') statusColor = '#e91e63';

        let rowHTML = `
            <td><strong>${escapeHtml(record.name)}</strong></td>
            <td>${escapeHtml(record.mobile)}</td>
            <td>${escapeHtml(record.shop)}</td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${escapeHtml(record.status)}</span></td>
        `;

        if(isAdminActive) {
            rowHTML += `
                <td>
                    <button class="btn-action btn-approve" onclick="updateStatus(${record.id}, 'Approved')">Approve</button>
                    <button class="btn-action btn-reject" onclick="updateStatus(${record.id}, 'Rejected')">Reject</button>
                    <button class="btn-action btn-delete" onclick="deleteRecord(${record.id})">Del</button>
                </td>
            `;
        }

        row.innerHTML = rowHTML;
        tableBody.appendChild(row);
    });
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

window.onload = function() {
    getSecurityCode();
    renderTableData();
};
