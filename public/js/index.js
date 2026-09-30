const OPERADORES = ['+', '-', '*', '/', '^', '%'];

document.getElementById('btn-validar')?.addEventListener('click', procesar);
document.getElementById('btn-limpiar')?.addEventListener('click', limpiar);
document.getElementById('expresion')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') procesar();
});

function limpiar() {
    const input = document.getElementById('expresion');
    const res = document.getElementById('resultado');
    const panel = document.getElementById('panel-conversiones');

    if (input) input.value = '';
    if (res) {
        res.className = 'alert d-none text-center fs-5 mb-3';
        res.textContent = '';
    }
    if (panel) panel.classList.add('d-none');
    input?.focus();
}

function procesar() {
    const input = document.getElementById('expresion')?.value.trim();
    const panel = document.getElementById('panel-conversiones');

    if (panel) panel.classList.add('d-none');

    if (!input) {
        mostrar('Por favor, ingresa una expresión.', 'alert-warning');
        return;
    }

    const tokens = tokenizar(input);
    if (!tokens.length) {
        mostrar('Expresión inválida.', 'alert-danger');
        return;
    }

    let tipo = '';
    let infija = '';
    let prefija = '';
    let postfija = '';

    if (tokens.length === 1 && esOperando(tokens[0])) {
        tipo = 'TÉRMINO SIMPLE';
        infija = tokens[0];
        prefija = tokens[0];
        postfija = tokens[0];
    } else if (esPostfija(tokens)) {
        tipo = 'POSTFIJA';
        postfija = tokens.join(' ');
        infija = postfijaAInfija(tokens);
        prefija = postfijaAPrefija(tokens);
    } else if (esPrefija(tokens)) {
        tipo = 'PREFIJA';
        prefija = tokens.join(' ');
        infija = prefijaAInfija(tokens);
        postfija = prefijaAPostfija(tokens);
    } else if (esInfija(tokens)) {
        tipo = 'INFIJA';
        infija = tokens.join(' ');
        const postTokens = infijaAPostfijaTokens(tokens);
        postfija = postTokens.join(' ');
        prefija = postfijaAPrefija(postTokens);
    } else {
        mostrar('Expresión INVÁLIDA', 'alert-danger');
        return;
    }

    mostrar(`Tipo detectado: <strong>${tipo}</strong>`, 'alert-success', true);

    document.getElementById('res-infija').textContent = infija;
    document.getElementById('res-prefija').textContent = prefija;
    document.getElementById('res-postfija').textContent = postfija;

    if (panel) panel.classList.remove('d-none');
}

function mostrar(texto, clase, esHtml = false) {
    const res = document.getElementById('resultado');
    if (res) {
        res.className = `alert ${clase} text-center fs-5 mb-3`;
        if (esHtml) res.innerHTML = texto;
        else res.textContent = texto;
        res.classList.remove('d-none');
    }
}

function tokenizar(expr) {
    const limpia = expr.trim();
    const regex = /\s/.test(limpia)
        ? /([a-zA-Z0-9_\.]+|[+\-*/^%()])/g
        : /([a-zA-Z]|[0-9]+(?:\.[0-9]+)?|[+\-*/^%()])/g;
    return limpia.match(regex) || [];
}

function esOperador(t) {
    return OPERADORES.includes(t);
}

function esOperando(t) {
    return /^[a-zA-Z0-9_\.]+$/.test(t) && !esOperador(t);
}

function esPostfija(tokens) {
    if (tokens.some(t => t === '(' || t === ')')) return false;
    if (!esOperador(tokens[tokens.length - 1])) return false;

    let pila = 0;
    for (const t of tokens) {
        if (esOperando(t)) {
            pila++;
        } else if (esOperador(t)) {
            if (pila < 2) return false;
            pila--;
        } else {
            return false;
        }
    }
    return pila === 1;
}

function esPrefija(tokens) {
    if (tokens.some(t => t === '(' || t === ')')) return false;
    if (!esOperador(tokens[0])) return false;

    let pila = 0;
    for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i];
        if (esOperando(t)) {
            pila++;
        } else if (esOperador(t)) {
            if (pila < 2) return false;
            pila--;
        } else {
            return false;
        }
    }
    return pila === 1;
}

function esInfija(tokens) {
    if (esOperador(tokens[0]) || esOperador(tokens[tokens.length - 1])) return false;

    let balance = 0;
    for (let i = 0; i < tokens.length; i++) {
        const actual = tokens[i];
        const sig = tokens[i + 1];

        if (actual === '(') balance++;
        if (actual === ')') balance--;
        if (balance < 0) return false;

        if (sig) {
            if (actual === '(' && sig === ')') return false;
            if (actual === '(' && esOperador(sig)) return false;
            if (esOperador(actual) && sig === ')') return false;
            if (esOperador(actual) && esOperador(sig)) return false;
            if (esOperando(actual) && esOperando(sig)) return false;
            if (esOperando(actual) && sig === '(') return false;
            if (actual === ')' && esOperando(sig)) return false;
        }
    }

    const ops = tokens.filter(esOperador).length;
    const vals = tokens.filter(esOperando).length;
    return balance === 0 && ops > 0 && vals === ops + 1;
}

function postfijaAInfija(tokens) {
    const pila = [];
    for (const t of tokens) {
        if (esOperando(t)) {
            pila.push(t);
        } else if (esOperador(t)) {
            const b = pila.pop();
            const a = pila.pop();
            pila.push(`(${a} ${t} ${b})`);
        }
    }
    let res = pila[0] || '';
    if (res.startsWith('(') && res.endsWith(')')) {
        res = res.slice(1, -1);
    }
    return res;
}

function postfijaAPrefija(tokens) {
    const pila = [];
    for (const t of tokens) {
        if (esOperando(t)) {
            pila.push(t);
        } else if (esOperador(t)) {
            const b = pila.pop();
            const a = pila.pop();
            pila.push(`${t} ${a} ${b}`);
        }
    }
    return pila[0] || '';
}

function prefijaAInfija(tokens) {
    const pila = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i];
        if (esOperando(t)) {
            pila.push(t);
        } else if (esOperador(t)) {
            const a = pila.pop();
            const b = pila.pop();
            pila.push(`(${a} ${t} ${b})`);
        }
    }
    let res = pila[0] || '';
    if (res.startsWith('(') && res.endsWith(')')) {
        res = res.slice(1, -1);
    }
    return res;
}

function prefijaAPostfija(tokens) {
    const pila = [];
    for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i];
        if (esOperando(t)) {
            pila.push(t);
        } else if (esOperador(t)) {
            const a = pila.pop();
            const b = pila.pop();
            pila.push(`${a} ${b} ${t}`);
        }
    }
    return pila[0] || '';
}

function infijaAPostfijaTokens(tokens) {
    const prec = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
    const salida = [];
    const pila = [];

    for (const t of tokens) {
        if (esOperando(t)) {
            salida.push(t);
        } else if (esOperador(t)) {
            while (
                pila.length > 0 &&
                pila[pila.length - 1] !== '(' &&
                prec[pila[pila.length - 1]] >= prec[t]
            ) {
                salida.push(pila.pop());
            }
            pila.push(t);
        } else if (t === '(') {
            pila.push(t);
        } else if (t === ')') {
            while (pila.length > 0 && pila[pila.length - 1] !== '(') {
                salida.push(pila.pop());
            }
            pila.pop();
        }
    }

    while (pila.length > 0) {
        salida.push(pila.pop());
    }

    return salida;
}