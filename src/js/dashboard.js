document.addEventListener('DOMContentLoaded', () => {
    const userData = localStorage.getItem('capacitaTgUser');

    if (!userData) {
        // Se não houver dados, redireciona para a página de login
        window.location.href = 'entrar.html';
        return;
    }

    const user = JSON.parse(userData);
    populateProfile(user);

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('capacitaTgUser');
        window.location.href = 'index.html';
    });
});

function populateProfile(user) {
    const userName = user.nome || user.nomeEmpresa;
    
    // Popula os campos com os dados do usuário
    document.getElementById('userName').textContent = userName;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userType').textContent = user.tipoUsuario === 'atirador' ? 'Atirador' : 'Empresa';
    document.getElementById('userCity').textContent = user.cidade;

    // Mostra a inicial do nome no avatar
    if (userName) {
        document.getElementById('userInitial').textContent = userName.charAt(0).toUpperCase();
    }
    
    // Mostra a unidade do TG apenas se for atirador
    const tgUnitContainer = document.getElementById('tgUnitContainer');
    if (user.tipoUsuario === 'atirador' && user.tg) {
        document.getElementById('userTgUnit').textContent = user.tg;
        tgUnitContainer.style.display = 'flex';
    } else {
        tgUnitContainer.style.display = 'none';
    }
}