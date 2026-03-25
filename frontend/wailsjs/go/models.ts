export namespace model {
	
	export class Connection {
	    name: string;
	    host: string;
	    port: number;
	    user: string;
	    identity_key?: string;
	    password?: string;
	    group?: string;
	    tags?: string[];
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new Connection(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.identity_key = source["identity_key"];
	        this.password = source["password"];
	        this.group = source["group"];
	        this.tags = source["tags"];
	        this.description = source["description"];
	    }
	}
	export class Settings {
	    default_user?: string;
	    default_port?: number;
	    default_identity_key?: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.default_user = source["default_user"];
	        this.default_port = source["default_port"];
	        this.default_identity_key = source["default_identity_key"];
	    }
	}

}

