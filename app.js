import express from 'express';
import compression from 'compression';
import Log4js from 'log4js';
import cluster from 'cluster';
import { cpus } from 'os';
import bcrypt from 'bcrypt';
import infoRouter from './info.js';
import createLogger from './utils.js';
import {__dirname} from './utils.js'

/*Configuro log4js */
Log4js.configure({
    appenders:{
        //que tipo de transport(lugares o dispositivos) donde enviamos las cosas
        console:{type:"console"},
        debugFile:{type:"file",filename:"./debug.log"},
        errorsFile:{type:"file",filename:"./errors.log"},
        errorLevelFilter:{
            type:"logLevelFilter",
            level:"error",
            appender:"errorsFile"
        }
    },
    categories:{
        //entorno de appenders
        default:{
            appenders:["console"],level:"all"    
        },
        DEV:{
            appenders:["debugFile","console"],level:"error"
        },
        PROD:{
            appenders:['console','errorLevelFilter'],level:"all"
        }
    }
})

const logger = Log4js.getLogger(process.env.NODE_ENV)

const app = express();

const PORT= process.env.PORT || 5000
/*Artillery*/

const isCluster = process.argv[3]==="CLUSTER";

if (isCluster&&cluster.isPrimary) {
    //instancio workers
    const numCPUs= cpus().length;
    console.log(`PID ${process.pid}`)
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit',worker=>{
        console.log(`worker ${worker.process.pid} murio terriblemente`)
        cluster.fork();
    })
}
else{
    
    app.listen(PORT,()=>console.log('te oigo en el puerto '+PORT))
    
}

app.use(express.static(__dirname+'/public'));

/*uso compression---> debo dejar instanciado: */
app.use(compression())
app.use('/info',infoRouter)

/*Profiling */
const users={}

app.get ('/newUser',async(req,res)=>{
    let {username="", password=""} = req.query;
    const saltRound= 10;
    if(!username||!password||users[username])return res.sendStatus(400)
    const salt = await bcrypt.genSalt(saltRound);
    const hash = await bcrypt.hash(password,salt)
    users[username]=hash;
    res.sendStatus(200)
})

app.get('/auth-bloq',(req,res)=>{
    let {username="", password=""}=req.query;
    if(!username||!password||users[username]) return res.sendStatus(400);
    if(bcrypt.compareSync(password,users[username]))return res.sendStatus(200)
    process.exit(1)
})

app.get('/auth-nobloq',async(req,res)=>{
    let {username="", password=""}=req.query;
    if(!username||!password||users[username]) return res.sendStatus(400);
    let login= await bcrypt.compare(password,users[username])
    if(login) res.sendStatus(200)
})



/*usando winston*/
//const loggerW =createLogger(process.env.NODE_ENV)
const loggerW =createLogger('DEV')


app.use((req,res,next)=>{
    loggerW.log('info',`${req.method} at ${req.path}`)
    next();
})

app.get('/winston',(req,res)=>{
    loggerW.info('saludando')
    res.send('holiguis')
})


/*Logger */

app.get('/error',(req,res)=>{
    logger.error("se quema la verduleria")
    res.send('Oh dios mio')
})


/*Winston */
app.on('error',(error)=>{
    loggerW.warn("Area 51, nos atacan los aliens!")
    console.log("Algo anda mal aqui")
})
app.get('/*',(req,res)=>{
    loggerW.warn("Area 51, terreno jamas visto")
    res.status(404).send({error:'Invalid endpoint'})
})