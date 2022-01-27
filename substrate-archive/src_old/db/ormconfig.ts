import config from './dbconfig'

const ormconfig = config()

// export dbconfig as default so that it can be use with typeorm-cli
export default ormconfig
