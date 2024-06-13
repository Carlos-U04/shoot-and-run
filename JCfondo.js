const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const keys = {};
let gameStarted = false;
let isMouseDown = false;
let score = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 15,
    speed: 1.5,
    color: 'red',
    weapon: {
        fireRate: 100,
        lastShot: 0,
        burstMode: false, // Nuevo: habilitar disparo en ráfaga
        incendiary: false, // Nuevo: habilitar balas incendiarias
        sideShoot: false, // Nuevo: habilitar disparos laterales
        bulletCount: 3, // Nuevo: cantidad de balas en ráfaga
        incendiaryDamage: 5, // Nuevo: daño adicional por fuego
        incendiaryDuration: 3000 // Nuevo: duración del efecto incendiario
    },
    health: 150
};

const enemies = [];
const bullets = [];
const elements = [];
const upgrades = [];
let enemyHealth = 30; // Vida inicial de los enemigos

// Variables para el cooldown de impacto
let playerHitCooldown = false;
let enemyHitCooldown = false;

// Variables del ratón
const mouse = { x: 0, y: 0 };

// Función para crear enemigos
function createEnemy() {
    const size = 20;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    enemies.push({ x, y, size, speed: 1, color: 'blue', health: enemyHealth });
}

// Función para crear elementos de terreno aleatorios
function createRandomElements(count, imageKeys) {
    for (let i = 0; i < count; i++) {
        const randomImageKey = imageKeys[Math.floor(Math.random() * imageKeys.length)];
        const element = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            image: images[randomImageKey],
            size: 50
        };
        elements.push(element);
    }
}

// Función para crear mejoras
function createUpgrade() {
    const size = 20;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    upgrades.push({ x, y, size: 20, color: 'green', type: 'upgrade' }); // Aumentar tamaño y cambiar color
}

// Función para crear modificaciones
function createModification() {
    const size = 20;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    upgrades.push({ x, y, size: 20, color: 'gray', type: 'modification' }); // Aumentar tamaño y cambiar color
}

function initGame() {
    loadImages(() => {
        createRandomElements(20, imageKeys);
        createUpgrade(); // Llama a la función para crear mejoras
        createModification(); // Llama a la función para crear modificaciones
        gameLoop();
    });
}

// Función para aplicar mejoras o modificaciones al jugador
function applyUpgrade(upgrade) {
    switch (upgrade.type) {
        case 'upgrade':
            applyRandomUpgrade();
            break;
        case 'modification':
            applyRandomModification();
            break;
    }
}

// Función para aplicar una mejora aleatoria al jugador
function applyRandomUpgrade() {
    const upgradesAvailable = [
        'burstMode', 'incendiary', 'sideShoot', 'healthRegen', 'speedBoost', 'fireRateBoost'
    ];
    const randomUpgrade = upgradesAvailable[Math.floor(Math.random() * upgradesAvailable.length)];

    switch (randomUpgrade) {
        case 'burstMode':
            player.weapon.burstMode = true;
            break;
        case 'incendiary':
            player.weapon.incendiary = true;
            break;
        case 'sideShoot':
            player.weapon.sideShoot = true;
            break;
        case 'healthRegen':
            player.healthRegen = true;
            break;
        case 'speedBoost':
            player.speed += 2;
            break;
        case 'fireRateBoost':
            player.weapon.fireRate -= 100;
            break;
    }
}

// Función para aplicar una modificación aleatoria al jugador
function applyRandomModification() {
    const modificationsAvailable = [
        'extraBullet', 'healthBurn', 'speedBurn', 'randomBurn'
    ];
    const randomModification = modificationsAvailable[Math.floor(Math.random() * modificationsAvailable.length)];

    switch (randomModification) {
        case 'extraBullet':
            player.weapon.bulletCount += 1;
            break;
        case 'healthBurn':
            player.health -= 10;
            break;
        case 'speedBurn':
            player.speed -= 2;
            break;
        case 'randomBurn':
            const randomBurn = Math.random();
            if (randomBurn < 0.5) {
                player.health -= 20;
            } else {
                player.speed -= 3;
            }
            break;
    }
}

// Función para dibujar el fondo
function drawBackground() {
    for (let x = 0; x < canvas.width; x += 50) {
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.fillStyle = '#32CD32'; // Verde lima
            ctx.fillRect(x, y, 50, 50);
        }
    }
}

// Función para dibujar los elementos
function drawElements() {
    elements.forEach(el => {
        ctx.drawImage(el.image, el.x, el.y, el.size, el.size);
    });
}

// Función para dibujar al jugador
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

// Función para dibujar enemigos
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - enemy.size / 2, enemy.size, enemy.size);
    });
}

// Función para dibujar las balas
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - bullet.size / 2, bullet.y + bullet.size);
        ctx.lineTo(bullet.x + bullet.size / 2, bullet.y + bullet.size);
        ctx.fill();
    });
}

// Función para dibujar la barra de vida del jugador
function drawPlayerHealthBar() {
    ctx.fillStyle = 'red';
    ctx.fillRect(20, 20, player.health, 10);
}

// Función para dibujar la barra de vida de los enemigos
function drawEnemyHealthBar() {
    enemies.forEach(enemy => {
        ctx.fillStyle = 'blue';
        ctx.fillRect(enemy.x - enemy.size / 2, enemy.y - 20, enemy.health, 5);
    });
}

// Función para actualizar al jugador
function updatePlayer() {
    if (keys['w'] && player.y > 0) player.y -= player.speed;
    if (keys['s'] && player.y < canvas.height) player.y += player.speed;
    if (keys['a'] && player.x > 0) player.x -= player.speed;
    if (keys['d'] && player.x < canvas.width) player.x += player.speed;
    checkPlayerMapCollision();
}

// Función para actualizar enemigos
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const moveX = (dx / distance) * enemy.speed;
            const moveY = (dy / distance) * enemy.speed;

            enemy.x += moveX;
            enemy.y += moveY;
        }

        // Aplicar daño incendiario si corresponde
        if (enemy.burning && enemy.burnEndTime > Date.now()) {
            enemy.health -= player.weapon.incendiaryDamage;
            if (enemy.health <= 0) {
                enemies.splice(index, 1);
            }
        }

        checkEnemyBulletCollision(enemy, index);
    });
}


// Función para actualizar las balas
function updateBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });
}

// Función para crear balas disparadas por el jugador
function shootWeapon() {
    const now = Date.now();
    if (now - player.weapon.lastShot > player.weapon.fireRate) {
        const bulletSpeed = 10;
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

        const createBullet = (offsetAngle) => {
            const bullet = {
                x: player.x,
                y: player.y,
                dx: Math.cos(angle + offsetAngle) * bulletSpeed,
                dy: Math.sin(angle + offsetAngle) * bulletSpeed,
                size: 5,
                color: player.weapon.incendiary ? 'orange' : 'yellow', // Cambiar color si es incendiaria
                incendiary: player.weapon.incendiary, // Propiedad incendiaria
                burnTime: player.weapon.incendiaryDuration
            };
            bullets.push(bullet);
        };

        createBullet(0); // Disparo principal
        if (player.weapon.sideShoot) {
            createBullet(Math.PI / 12); // Disparo lateral derecho
            createBullet(-Math.PI / 12); // Disparo lateral izquierdo
        }

        if (player.weapon.burstMode) {
            for (let i = 1; i < player.weapon.bulletCount; i++) {
                setTimeout(() => {
                    createBullet(0);
                }, i * 100); // Disparar balas en ráfaga con retraso de 100ms
            }
        }

        player.weapon.lastShot = now;
    }
}

// Función para verificar colisiones entre dos objetos circulares
function checkCircularCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.size / 2 + obj2.size / 2;
}

// Función para verificar colisiones entre el jugador y los elementos del mapa
function checkPlayerMapCollision() {
    elements.forEach(element => {
        if (checkCircularCollision(player, element)) {
            const dx = player.x - element.x;
            const dy = player.y - element.y;
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * player.speed;
            const moveY = Math.sin(angle) * player.speed;
            player.x += moveX;
            player.y += moveY;
        }
    });
}

// Función para verificar colisiones entre los enemigos y las balas
function checkEnemyBulletCollision(enemy, enemyIndex) {
    bullets.forEach((bullet, bulletIndex) => {
        if (checkCircularCollision(bullet, enemy)) {
            // Reducir la salud del enemigo
            enemy.health -= 10;
            
            // Eliminar la bala que impactó al enemigo
            bullets.splice(bulletIndex, 1);

            // Si el enemigo muere, eliminarlo y aumentar la puntuación
            if (enemy.health <= 0) {
                enemies.splice(enemyIndex, 1);
                score += 100;
            }
        }
    });
}


// Función para verificar colisiones entre el jugador y los enemigos
function checkPlayerEnemyCollision() {
    enemies.forEach((enemy, enemyIndex) => {
        if (checkCircularCollision(player, enemy)) {
            if (!playerHitCooldown) {
                player.health -= 10;
                playerHitCooldown = true;
                setTimeout(() => {
                    playerHitCooldown = false;
                }, 1000);
            }
            enemies.splice(enemyIndex, 1);
        }
    });

    if (player.health <= 0) {
        gameOver(); // Llamar a gameOver() cuando la salud del jugador es menor o igual a cero
    }
}

// Función para dibujar el menú de inicio
function drawStartMenu() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mi Juego', canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = '24px serif';
    ctx.fillText('Jugar', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Ajustes', canvas.width / 2, canvas.height / 2 + 50);
}

// Función para manejar clics en el menú
function handleMenuClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    if (x > canvas.width / 2 - 50 && x < canvas.width / 2 + 50) {
        if (y > canvas.height / 2 - 20 && y < canvas.height / 2 + 20) {
            gameStarted = true;
        } else if (y > canvas.height / 2 + 30 && y < canvas.height / 2 + 70) {
            alert('Ajustes aún no implementados');
        }
    }
}

// Función para mostrar la pantalla de muerte
// Función para mostrar la pantalla de muerte
function gameOver() {
    gameStarted = false;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡Perdiste!', canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = '24px serif';
    ctx.fillText('Puntuación: ' + score, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Reiniciar', canvas.width / 2, canvas.height / 2 + 50);
}


function handleGameOverClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    if (x > canvas.width / 2 - 50 && x < canvas.width / 2 + 50) {
        if (y > canvas.height / 2 + 30 && y < canvas.height / 2 + 70) {
            restartGame();
        }
    }
}

canvas.addEventListener('click', handleMenuClick);

// Escuchar clics del ratón para disparar el arma del jugador
canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    shootWeapon();
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

// Agregar el event listener para clics en la pantalla de muerte
canvas.addEventListener('click', handleGameOverClick);

// Función para reiniciar el juego
// Agregar el event listener para clics en la pantalla de muerte
canvas.addEventListener('click', handleGameOverClick);

// Función para manejar clics en la pantalla de muerte
function handleGameOverClick(event) {
    const x = event.clientX;
    const y = event.clientY;

    if (x > canvas.width / 2 - 50 && x < canvas.width / 2 + 50) {
        if (y > canvas.height / 2 + 30 && y < canvas.height / 2 + 70) {
            restartGame(); // Llamar a la función para reiniciar el juego solo si se hace clic en el botón "Reiniciar"
        }
    }
}

// Función para reiniciar el juego
function restartGame() {
    // Reiniciar variables de juego
    player.health = 150;
    enemies = [];
    bullets = [];
    elements = [];
    upgrades = [];
    score = 0;
    gameStarted = true;
    // Iniciar el bucle del juego nuevamente
    gameLoop();
}


// Escuchar eventos de teclado para mover al jugador
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});


// Función principal del bucle del juego
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted) {
        drawBackground();
        drawElements();
        updatePlayer();
        updateBullets();
        drawPlayer();
        drawBullets();
        updateEnemies();
        drawEnemies();
        checkPlayerEnemyCollision();
        drawPlayerHealthBar();
        drawEnemyHealthBar();
        drawUpgrades(); // Nuevo: Dibujar las mejoras
        checkPlayerUpgradeCollision(); // Nuevo: Verificar colisión con las mejoras
		
		if (isMouseDown) {
        shootWeapon();
    }
    } else {
        drawStartMenu();
    }

    requestAnimationFrame(gameLoop);
}

// Función para dibujar las mejoras
function drawUpgrades() {
    upgrades.forEach(upgrade => {
        ctx.fillStyle = 'black'; // Color de las mejoras
        ctx.fillRect(upgrade.x - upgrade.size / 2, upgrade.y - upgrade.size / 2, upgrade.size, upgrade.size);
    });
}

// Función para verificar colisiones entre el jugador y las mejoras
function checkPlayerUpgradeCollision() {
    upgrades.forEach((upgrade, index) => {
        if (checkCircularCollision(player, upgrade)) {
            applyUpgrade(upgrade);
            upgrades.splice(index, 1); // Remover la mejora de la lista
        }
    });
}

// Cargar imágenes y comenzar el juego
const images = {};

const imagePaths = {
    tree1: 'material/ArbolRosa.png',
    tree2: 'material/ArbolSecoMusgoso.png',
    tree3: 'material/ArbolSecoMusgosoLimpio.png',
    tree4: 'material/ArbolSecoNevado.png',
    tree5: 'material/ArbolSecoNormal.png',
    tree6: 'material/ArbolSecoOscuro.png',
    tree7: 'material/ArbolSecoPino.png',
    tree8: 'material/ArbolTronco.png',
    tree9: 'material/ArbolVerde1.png',
    tree10: 'material/ArbolVerde2.png',
    tree11: 'material/ArbolVerde2Adornado.png',
    tree12: 'material/ArbolVerde3.png',
    tree13: 'material/ArbolVerde4.png',
    tree14: 'material/ArbolVerde5.png',
    tree15: 'material/Palmera.png',
    tree16: 'material/Pino.png',
    rock1: 'material/Roca1.png',
    rock2: 'material/Roca2.png',
    rock3: 'material/Roca3.png',
    rock4: 'material/Roca4.png',
    rock5: 'material/Roca5.png',
    rock6: 'material/Roca6.png',
    rock7: 'material/Roca7.png',
    rock8: 'material/Roca8.png',
    rock9: 'material/Roca9.png',
    rock10: 'material/Roca10.png',
    rock11: 'material/Roca11.png',
    rock12: 'material/Roca12.png',
    rock13: 'material/Roca13.png',
    rock14: 'material/Roca14.png',
    rock15: 'material/Roca15.png',
};

const imageKeys = Object.keys(imagePaths);

function loadImages(callback) {
    let loadedCount = 0;
    const totalImages = imageKeys.length;

    imageKeys.forEach(key => {
        const img = new Image();
        img.src = imagePaths[key];
        img.onload = () => {
            images[key] = img;
            loadedCount++;
            if (loadedCount === totalImages) {
                callback(); // Cuando todas las imágenes están cargadas, llama al callback
            }
        };
    });
}

function initGame() {
    loadImages(() => {
        createRandomElements(31, imageKeys);
        gameStarted = false; // Asegúrate de que el juego comience con el menú de inicio
        gameLoop();
    });
}


initGame();

loadImages(() => {
    console.log("Imágenes cargadas, creando elementos aleatorios y comenzando el juego");
    createRandomElements(16, [
        'tree1', 'tree2', 'tree3', 'tree4', 'tree5', 'tree6',
        'tree7', 'tree8', 'tree9', 'tree10', 'tree11', 'tree12',
        'tree13', 'tree14', 'tree15', 'tree16'
    ]);
    createRandomElements(15, [
        'rock1', 'rock2', 'rock3', 'rock4', 'rock5', 'rock6',
        'rock7', 'rock8', 'rock9', 'rock10', 'rock11', 'rock12',
        'rock13', 'rock14', 'rock15'
    ]);
    gameLoop();
    setInterval(createEnemy, 3000);
});
