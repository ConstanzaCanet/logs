import winston from 'winston';

/*Configuro WINSTON*/

const createLogger=(env)=>{
    if(env==="DEV"){
        return winston.createLogger({
            transports:[
                    new winston.transports.File({ filename: 'combined.log' }),
                    new winston.transports.File({filename:"errors.log",level:"error"})
              ]
        })
    }else{
        return winston.createLogger({
            transport:[
                new winston.transports.Console({level:"info"})
            ]
        })
    }
}
export default createLogger;