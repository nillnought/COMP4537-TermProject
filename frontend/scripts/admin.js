const backendURL = "http://localhost:8000";

document.getElementById('signout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', async() =>{
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    if (!token || userType !== 'admin') {
        window.location.href = '/';
    }

    document.getElementById('signout').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        localStorage.removeItem('userId');
        window.location.href = '/frontend/';
    });
    try {
        const res = await fetch(`${backendURL}/api/admin/user-tokens`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch users', res.err);
        }

        const users = await res.json();

        // Render users
        const container = document.getElementById('user-list');
        container.innerHTML = '';

        users.forEach(user => {
            const div = document.createElement('div');
            div.classList.add('user-row');

            div.innerHTML = `
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Current Tokens:</strong> <span id="token-count-${user.id}">${user.tokens ?? 0}</span></p>
        <div class="admin-actions">
            <input type="number" id="input-${user.id}" placeholder="Amt" style="width: 60px;">
            <button onclick="addTokens('${user.id}')">Add Tokens</button>
        </div>
        <hr/>
    `;
            container.appendChild(div);
        });

    } catch (err) {
        console.error(err);
    }
});


async function addTokens(targetUserId) {
    const amount = document.getElementById(`input-${targetUserId}`).value;
    const token = localStorage.getItem('token');

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount");
        return;
    }

    try {
        const res = await fetch(`${backendURL}/api/admin/add-tokens`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUserId: targetUserId,
                amount: parseInt(amount)
            })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to update tokens');


        document.getElementById(`token-count-${targetUserId}`).innerText = data.newTotal;
        document.getElementById(`input-${targetUserId}`).value = '';
        alert('Tokens added successfully!');

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
}


