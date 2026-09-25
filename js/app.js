let valorEntrada = document.getElementById("valor").value ;
let descricao = document.getElementById("descricao").value ;
let tipo = document.getElementById("tipo").value ;


let entSald = prompt(Number("Digite o valor de entrada: "));
let saidSald = prompt(Number("Digite o valor de saída: "));

let valorFinal = entSald - saidSald;

console.log("O valor Final é : " + valorFinal);
console.log(descricao);
console.log(valorEntrada);
console.log(tipo);