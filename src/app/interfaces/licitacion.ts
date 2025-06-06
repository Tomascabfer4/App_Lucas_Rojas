export interface Licitacion {
    firebaseid:string,
    objectid:string,
    item:number,
    fechapresentacion:Date,
    cliente:string,
    titulo:string,
    numexpediente:string,
    tipo:string,
    tipocontrato:string,
    objetocontrato:string,
    importe:number,
    fechaformalizacion:Date, //Fecha Formalizacion Contrato (Fecha inicio)
    presupuestopor:string,
    presentadapor:string,
    estadoini:string,
    estadofinal:string,
    duracioncontratoanyo:string,
    observaciones:string,
    captadapor:string, 
    estudiopor:string,
    rutacarpeta:string,
    importeanual:number,
    fechafincontrato:Date,
    prorrogas:string,
    prorroga1:Date,
    prorroga2:Date,
    prorroga3:Date,
    fianza:number,
    garantia:string,
    responsable:string,
    eventos:any[],
    periodos:any[]
}
