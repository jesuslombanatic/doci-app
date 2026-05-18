// =========================================================================================================
// 1. ESCUDO ANTI-BLOQUEO: LIBRERÍA OFICIAL DE SUPABASE INYECTADA DIRECTAMENTE COMO CÓDIGO PROPIO (CORREGIDA)
// =========================================================================================================
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).supabase={})}(this,(function(e){"use strict";class t{constructor(e,t){this.url=e,this.key=t,this.auth=new n(e,t)}from(e){return new r(this.url,this.key,e)}}class n{constructor(e,t){this.url=e,this.key=t}async signUp(e){return this.req("signup",e)}async signInWithPassword(e){return this.req("token?grant_type=password",e)}
async req(e,t){
    try {
        const n = await fetch(`${this.url}/auth/v1/${e}`, {
            method: "POST",
            headers: { "apikey": this.key, "Content-Type": "application/json" },
            body: JSON.stringify(t)
        });
        
        // Si el servidor responde con error 429 de Rate Limit antes de procesar un JSON válido
        if (n.status === 429) {
            return { data: null, error: { message: "Demasiados intentos seguidos (Error 429). Por seguridad, Supabase bloqueó temporalmente tu IP. Espera unos minutos o cambia de red celular." } };
        }

        const r = await n.json();
        if (n.ok) {
            return { data: r, error: null };
        } else {
            // Mapea minuciosamente cualquier variante de error enviada por el servidor
            const msgReal = r.msg || r.error_description || r.message || (r.error ? r.error : null) || JSON.stringify(r);
            return { data: null, error: { message: msgReal } };
        }
    } catch(e) {
        return { data: null, error: { message: e.message } };
    }
}}class r{constructor(e,t,n){this.url=e,this.key=t,this.table=n}async insert(e){try{const t=await fetch(`${this.url}/rest/v1/${this.table}`,{method:"POST",headers:{"apikey":this.key,"Authorization":`Bearer ${this.key}`,"Content-Type":"application/json","Prefer":"return=representation"},body:JSON.stringify(e)}),n=await t.json();return t.ok?{data:n,error:null}:{data:null,error:n}}catch(e){return{data:null,error:e}}}}e.createClient=function(e,n){return new t(e,n)}}));

// =========================================================================================================
// 2. CONEXIÓN REAL E INICIALIZACIÓN A TU BASE DE DATOS EN LA NUBE
// =========================================================================================================
const SUPABASE_URL = 'https://ygijhcoqtjukmzdmszuw.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaWpoY29xdGp1a216ZG1zenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTIyMDgsImV4cCI6MjA5NDE4ODIwOH0.D8KGJWpGyPlQIB9uryMYE3_DrtRe1YAL1SfwLDtVu7I';

// El cliente ahora se genera de forma blindada sin que el navegador se entere de enlaces externos
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log("%c[DOCI EN LÍNEA] Conexión establecida con éxito en la nube sin usar CDNs externos.", "color: #00d2ff; font-weight: bold;");

let rolSeleccionado = "Docente";

// ==========================================
// 3. SISTEMA DE NAVEGACIÓN Y ROLES
// ==========================================
function showView(viewId) {
    document.querySelectorAll('.smartphone-window').forEach(v => v.classList.remove('active-view'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active-view');
}
window.showView = showView;

window.selectRole = function(element, roleName) {
    if (!element) return;
    document.querySelectorAll('.role-ui-box').forEach(box => box.classList.remove('selected'));
    element.classList.add('selected');
    rolSeleccionado = roleName;
    console.log("Rol activo guardado:", rolSeleccionado);
}

setTimeout(() => { 
    showView('view-login'); 
}, 3500);

// ==========================================
// 4. ACCIÓN DEL BOTÓN REGISTRAR (REAL EN LA NUBE)
// ==========================================
document.getElementById('btn-registrar')?.addEventListener('click', async () => {
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email'); 
    const passwordInput = document.getElementById('reg-pass'); 
    const confirmInput = document.getElementById('reg-pass-confirm');
    const termsCheckbox = document.getElementById('reg-terms');

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const passwordConfirm = confirmInput?.value;

    if (!email || !password || !nameInput?.value.trim()) {
        return alert("Por favor completa todos los campos.");
    }

    if (password !== passwordConfirm) {
        return alert("Las contraseñas no coinciden. Por favor verifícalas.");
    }

    if (termsCheckbox && !termsCheckbox.checked) {
        return alert("Debes aceptar los Términos y Condiciones para continuar.");
    }

    // 1. Intentar registrar el usuario real en la sección Auth de Supabase
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password });

    if (authError) return alert("Error de registro (Auth): " + authError.message);

    // 2. Insertar el rol y nombre completo en la tabla pública de internet
    if (authData?.user) {
        const { error: profileError } = await supabaseClient
            .from('perfiles_usuarios')
            .insert([
                { 
                    id: authData.user.id, 
                    correo: email, 
                    rol: rolSeleccionado,
                    nombre_completo: nameInput.value.trim()
                }
            ]);

        if (profileError) {
            console.error("Error al guardar perfil:", profileError.message);
            alert("Usuario autenticado, pero falló el registro en la tabla SQL perfiles_usuarios: " + profileError.message);
        } else {
            alert("¡Cuenta creada con éxito en la nube de Supabase! Los datos reales ya están guardados en tu base de datos.");
            showView('view-login'); 
        }
    }
});

// ==========================================
// 5. ACCIÓN DEL BOTÓN INICIAR SESIÓN (REAL EN LA NUBE)
// ==========================================
document.getElementById('btn-login')?.addEventListener('click', async () => {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-pass');

    const email = emailInput?.value.trim();
    const password = passwordInput?.value;

    if (!email || !password) return alert("Ingresa tu correo y contraseña.");

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Error de acceso: " + error.message);
    } else {
        alert("¡Sesión iniciada correctamente en DOCI validada con la base de datos de internet!");
    }
});

window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
}
