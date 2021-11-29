var incrementNumberMainNS = (function () {

    function enableOrDisableField(formContext, fieldSchemaName, isDisabling){
        formContext.getControl(fieldSchemaName).setDisabled(isDisabling);
    }
		
	function onLoad(executionContext){
		debugger;
		var formContext = executionContext.getFormContext();
        let formType = formContext.ui.getFormType();

        const eFormTypes = {
            CREATE: 1,
            UPDATE: 2,
        }

        if(formType == eFormTypes.CREATE){
            enableOrDisableField(formContext, "mtx_objectivecode", false);
            enableOrDisableField(formContext, "mtx_incrementingnumberint", false);
        }
	}

    function onSave(executionContext){
        debugger;
		var formContext = executionContext.getFormContext();
        enableOrDisableField(formContext, "mtx_objectivecode", true);
        enableOrDisableField(formContext, "mtx_incrementingnumberint", true);
    }
	
    return {
		OnLoad: onLoad,
        OnSave: onSave
    };
})()