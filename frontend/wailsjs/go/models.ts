export namespace design {
	
	export class DesignConfig {
	    borders: number;
	    fontSize: number;
	    fontColor: string;
	    fontFamily: string;
	
	    static createFrom(source: any = {}) {
	        return new DesignConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.borders = source["borders"];
	        this.fontSize = source["fontSize"];
	        this.fontColor = source["fontColor"];
	        this.fontFamily = source["fontFamily"];
	    }
	}

}

export namespace form {
	
	export class ButtonDef {
	    label: string;
	    exitCode: number;
	
	    static createFrom(source: any = {}) {
	        return new ButtonDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.exitCode = source["exitCode"];
	    }
	}
	export class FieldDef {
	    label: string;
	    type: string;
	    defaultValue: string;
	    items: string[];
	    srcValue: string;
	
	    static createFrom(source: any = {}) {
	        return new FieldDef(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.label = source["label"];
	        this.type = source["type"];
	        this.defaultValue = source["defaultValue"];
	        this.items = source["items"];
	        this.srcValue = source["srcValue"];
	    }
	}
	export class FormConfigResponse {
	    id: string;
	    subId: string;
	    windowIcon: string;
	    title: string;
	    text: string;
	    design: design.DesignConfig;
	    itemSeparator: string;
	    separator: string;
	    fields: FieldDef[];
	    buttons: ButtonDef[];
	
	    static createFrom(source: any = {}) {
	        return new FormConfigResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.subId = source["subId"];
	        this.windowIcon = source["windowIcon"];
	        this.title = source["title"];
	        this.text = source["text"];
	        this.design = this.convertValues(source["design"], design.DesignConfig);
	        this.itemSeparator = source["itemSeparator"];
	        this.separator = source["separator"];
	        this.fields = this.convertValues(source["fields"], FieldDef);
	        this.buttons = this.convertValues(source["buttons"], ButtonDef);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace list {
	
	export class ExecuteConfig {
	    key: string;
	    shell: string;
	    exitCode: number;
	
	    static createFrom(source: any = {}) {
	        return new ExecuteConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.shell = source["shell"];
	        this.exitCode = source["exitCode"];
	    }
	}
	export class ListConfigResponse {
	    id: string;
	    windowIcon: string;
	    title: string;
	    text: string;
	    list: string[];
	    design: design.DesignConfig;
	    reloads: ExecuteConfig[];
	    executes: ExecuteConfig[];
	    execQuits: ExecuteConfig[];
	    delimiter: string;
	    withNth: number;
	    headerLines: number;
	    cycle: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ListConfigResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.windowIcon = source["windowIcon"];
	        this.title = source["title"];
	        this.text = source["text"];
	        this.list = source["list"];
	        this.design = this.convertValues(source["design"], design.DesignConfig);
	        this.reloads = this.convertValues(source["reloads"], ExecuteConfig);
	        this.executes = this.convertValues(source["executes"], ExecuteConfig);
	        this.execQuits = this.convertValues(source["execQuits"], ExecuteConfig);
	        this.delimiter = source["delimiter"];
	        this.withNth = source["withNth"];
	        this.headerLines = source["headerLines"];
	        this.cycle = source["cycle"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace network {
	
	export class WindowRequestForWebView {
	    isKeep: boolean;
	    keepExcludes: string[];
	
	    static createFrom(source: any = {}) {
	        return new WindowRequestForWebView(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isKeep = source["isKeep"];
	        this.keepExcludes = source["keepExcludes"];
	    }
	}
	export class GuiRequestForWebview {
	    id: string;
	    viewMode: string;
	    form: form.FormConfigResponse;
	    list: list.ListConfigResponse;
	    windowInfo: WindowRequestForWebView;
	
	    static createFrom(source: any = {}) {
	        return new GuiRequestForWebview(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.viewMode = source["viewMode"];
	        this.form = this.convertValues(source["form"], form.FormConfigResponse);
	        this.list = this.convertValues(source["list"], list.ListConfigResponse);
	        this.windowInfo = this.convertValues(source["windowInfo"], WindowRequestForWebView);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

