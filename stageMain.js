var stageMainNS = (function () {

	const eFieldParameters = {
		ATTRIBUTE: 1,
		CONTROL: 2
	};

	const eErrorCode = {
		NOENUM: 11111,
		NOATTRIBUTE: 22222,
		NOCONTROL: 33333
	};

	const eFieldRequirement = {
		REQUIRED: "required",
		OPTIONAL: "optional",
		NONE: "none"
	};

	function throwError(myErrorCode, myDetails, myMessage){
		Xrm.Navigation.openErrorDialog({ errorCode:myErrorCode, details:myDetails, message:myMessage }).then(
			function (success) {
				console.log(success);        
			},
			function (error) {
				console.log(error);
			});
	}

	function findFieldParameters(formContext, fieldSchemaName, eFieldParameter){
		let parameterToCheck;
		switch(eFieldParameter){
			case eFieldParameters.ATTRIBUTE:
				parameterToCheck = formContext.getAttribute(fieldSchemaName);
				break;
			case eFieldParameters.CONTROL:
				parameterToCheck = formContext.getControl(fieldSchemaName);
				break;
			default:
				throwError(eErrorCode.NOENUM, "eFieldParameter value not found", "eFieldParameter error");
		}

		if(parameterToCheck == null){
			switch(eFieldParameter){
				case eFieldParameters.ATTRIBUTE:
					throwError(eErrorCode.ATTRIBUTE, "Attribute of " + fieldSchemaName + " not found", "Attribute error");
				case eFieldParameters.CONTROL:
					throwError(eErrorCode.ATTRIBUTE, "Control of " + fieldSchemaName + " not found", "Control error");
				default:
					throwError(eErrorCode.NOENUM, "eFieldParameter value not found", "eFieldParameter error");
			}
		}

		return parameterToCheck;
	}
	
	function setFieldRequirmentLevel(formContext, fieldSchemaName, requirmentLevelValue){
		let fieldAttribute = findFieldParameters(formContext, fieldSchemaName, eFieldParameters.ATTRIBUTE);
		fieldAttribute.setRequiredLevel(requirmentLevelValue);
	}
	
	function showOrHideField(formContext, fieldSchemaName, hideOrShowValue){
		let fieldControl = findFieldParameters(formContext, fieldSchemaName, eFieldParameters.CONTROL);
		fieldControl.setVisible(hideOrShowValue);
	}

	function fillFieldWithData(formContext, fieldSchemaName, data){
		let fieldAttribute = findFieldParameters(formContext, fieldSchemaName, eFieldParameters.ATTRIBUTE);
		fieldAttribute.setValue(data);
	}
	
	function checkMailRequirementField(executionContext, formContext) {
		debugger;
		if(formContext == null){
			formContext = executionContext.getFormContext();
		}
		
		const mailRequirementFieldSchemaName = "mtx_isrequiredsendingmailbit";
		let mailRequirementFieldAttribute = findFieldParameters(formContext, mailRequirementFieldSchemaName, eFieldParameters.ATTRIBUTE);

		const mailNotificationFieldSchemaName = "mtx_mailnotification";
		const mailIsSentFieldSchemaName = "mtx_issentmailbit";

		let mailRequirementFieldValue = mailRequirementFieldAttribute.getValue();
		if(mailRequirementFieldValue == 1){
			showOrHideField(formContext, mailNotificationFieldSchemaName, true);
			showOrHideField(formContext, mailIsSentFieldSchemaName, true);
			setFieldRequirmentLevel(formContext, mailIsSentFieldSchemaName, eFieldRequirement.REQUIRED);
		} else{
			showOrHideField(formContext, mailNotificationFieldSchemaName, false);
			showOrHideField(formContext, mailIsSentFieldSchemaName, false);
			setFieldRequirmentLevel(formContext, mailIsSentFieldSchemaName, eFieldRequirement.NONE);
			fillFieldWithData(formContext, mailNotificationFieldSchemaName, null);
			fillFieldWithData(formContext, mailIsSentFieldSchemaName, null);
		}
    };
	
	function onSave(executionContext){
		debugger;
		var formContext = executionContext.getFormContext();
		
		const fieldToCheckSchemaName = "mtx_issentmailbit";
		let fieldToCheckControl = findFieldParameters(formContext, fieldToCheckSchemaName, eFieldParameters.CONTROL);
		if(fieldToCheckControl.getVisible() == false){
			return;
		}

		let fieldToCheckAttribute = findFieldParameters(formContext, fieldToCheckSchemaName, eFieldParameters.ATTRIBUTE);
		if(fieldToCheckAttribute.getValue() == 0){
			alert("The required fields were not checked!");
			let saveEvent = executionContext.getEventArgs();
			saveEvent.preventDefault();
		}
	}

	function initOnChange(formContext, fieldSchemaName, functionToLink){
		let fieldAttribute = findFieldParameters(formContext, fieldSchemaName, eFieldParameters.ATTRIBUTE);
		fieldAttribute.addOnChange(functionToLink);


		formContext.getAttribute("nameOfField").addOnChange(checkMailRequirementField);
	}

	function initAllOnChanges(executionContext){
		var formContext = executionContext.getFormContext();

		initOnChange(formContext, "mtx_isrequiredsendingmailbit", function() { checkMailRequirementField(executionContext, formContext); });
	}

	function onLoad(executionContext){
		debugger;
		initAllOnChanges(executionContext);
		checkMailRequirementField(executionContext, null);
	}
	
    return {
		OnSave: onSave,
		OnLoad: onLoad
    };
})()