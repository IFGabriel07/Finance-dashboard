    

let totalDinheiroEntrado = 0;
let totalDinheiroSaido = 0;
let saldoAtual = 0;

let formulario = document.querySelector("form");

formulario.addEventListener("submit", function (event) {
    event.preventDefault();

    
    let descricao = document.getElementById("descricao").value;
    let valor = Number(document.getElementById("valor").value);
    let tipo = document.getElementById("tipo").value;
    
    
    
    if (tipo === "entradas") {
        totalDinheiroEntrado = totalDinheiroEntrado + valor;
    } else {
        totalDinheiroSaido = totalDinheiroSaido + valor;
    }
    
    saldoAtual = totalDinheiroEntrado - totalDinheiroSaido;
    
    document.getElementById("entradas").textContent = totalDinheiroEntrado;
    document.getElementById("saidas").textContent = totalDinheiroSaido;
    document.getElementById("saldo").textContent = saldoAtual;
    


    
    console.log("Total de Entradas:", totalDinheiroEntrado);
    console.log("Total de Saídas:", totalDinheiroSaido);
    console.log("Saldo Atual:", saldoAtual);
    console.log("Descrição:", descricao);
});