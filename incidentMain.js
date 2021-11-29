var incidentMainNS = (function () {

  const eFieldParameters = {
		ATTRIBUTE: 1,
		CONTROL: 2
	};

  const eErrorCode = {
		NOENUM: 11111,
		NOATTRIBUTE: 22222,
		NOCONTROL: 33333
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

  function enterStringValue(formContext, valueToPass, fieldName){
    let fieldAttribute = findFieldParameters(formContext, fieldName, eFieldParameters.ATTRIBUTE);
    fieldAttribute.setValue(valueToPass);
  }

  function enterDatetimeValue(formContext, valueToPass, fieldName){
    var date = new Date(valueToPass);
    let fieldAttribute = findFieldParameters(formContext, fieldName, eFieldParameters.ATTRIBUTE);
    fieldAttribute.setValue(date);
  }

  function enterOptionsetValue(formContext, valueToPass, fieldName){
    let fieldAttribute = findFieldParameters(formContext, fieldName, eFieldParameters.ATTRIBUTE);
    fieldAttribute.setValue(valueToPass);
  }

    function passNonLookupValue(formContext, valueToPass, fieldName){
      var attributeType = formContext.getAttribute(fieldName).getAttributeType();
      const attributeTypes = {
        STRING: "string",
        DATETIME: "datetime",
        OPTIONSET: "optionset",
      }
      switch(attributeType){
        case attributeTypes.STRING:
          enterStringValue(formContext, valueToPass, fieldName);
          break;
        case attributeTypes.DATETIME:
          enterDatetimeValue(formContext, valueToPass, fieldName);
          break;
        case attributeTypes.OPTIONSET:
          enterOptionsetValue(formContext, valueToPass, fieldName);
          break;
        default:
          alert("Unknown field attribute");
          break;
      }
    }

    function passLookupValue(formContext, id, name, entityType, fieldName){
        let lookup = new Array();
        lookup[0] = new Object;
        lookup[0].id = id;
        lookup[0].name = name;
        lookup[0].entityType = entityType;
        let formattedFieldName = fieldName.substring(1, fieldName.length - 6);        // removing "_" and "_value" from the name to find the current form field
        let fieldAttribute = findFieldParameters(formContext, formattedFieldName, eFieldParameters.ATTRIBUTE);
        fieldAttribute.setValue(lookup);
    }

    function passCustomFieldsValuesToForm(result, listOfRequiredFieldNames, formContext){
      listOfRequiredFieldNames.forEach(fieldName => {
        if(fieldName.includes("mtx_")){                                               // if custom entity

          let valueToPass = result[fieldName];
          if(valueToPass != null){
            if(fieldName.startsWith("_") && fieldName.endsWith("_value")){              // if lookup type
              let name = result[fieldName +"@OData.Community.Display.V1.FormattedValue"];
              let entityType = result[fieldName + "@Microsoft.Dynamics.CRM.lookuplogicalname"];
              passLookupValue(formContext, valueToPass, name, entityType, fieldName);
            } else{
              passNonLookupValue(formContext, valueToPass, fieldName);
            }
          }

        }
      });
    }

    function passVanillaFieldsValuesToForm(result, listOfRequiredFieldNames, formContext){
      formContext.getAttribute("mtx_address").setValue(result["address1_city"]);
    }

    function getRelatedData(formContext, id){
      var listOfRequiredFieldNames = [
        "mtx_enddate",
        "mtx_educationcode", "mtx_appointmentname",
        "_mtx_prefixid_value", "_mtx_professionid_value",
        "_mtx_accountid_value", "mtx_professionallevelcode",
        "mtx_appointmentdescription",
        "_mtx_soldierjobid_value", "mtx_assigningranks",
        "address1_city"
      ];

      var requestSelect = listOfRequiredFieldNames.toString();
      Xrm.WebApi.retrieveRecord("contact", id, "?$select=" + requestSelect).then(
        function success(result) {
          debugger;
          passCustomFieldsValuesToForm(result, listOfRequiredFieldNames, formContext);    // dynamic for custom fields that share the schema same name 
          passVanillaFieldsValuesToForm(result, listOfRequiredFieldNames, formContext);   // hard coded for vanilla and fields with different schema names
        },
        function error(error) {
            Xrm.Navigation.openAlertDialog({
                text: error.message
            });
        }
    );
    }

    function cleanRelatedFields(formContext){
      var listOfRequiredFieldNames = [
        "mtx_enddate",
        "mtx_educationcode", "mtx_appointmentname",
        "mtx_prefixid", "mtx_professionid",
        "mtx_accountid", "mtx_professionallevelcode",
        "mtx_appointmentdescription",
        "mtx_soldierjobid", "mtx_assigningranks",
        "mtx_address"
      ];
      listOfRequiredFieldNames.forEach(fieldName => {
        formContext.getAttribute(fieldName).setValue(null);
      });
    }
	
    function onChangeContactId(executionContext, formContext){
      debugger;
      if(formContext == null){
        formContext = executionContext.getFormContext();
      }

      const fieldChangedSchemaName = "mtx_contactid";
      let fieldAttribute = findFieldParameters(formContext, fieldChangedSchemaName, eFieldParameters.ATTRIBUTE);
      let lookupValue = fieldAttribute.getValue();
      if(lookupValue == null){
        cleanRelatedFields(formContext);
      } else{
        let id = lookupValue[0].id;
        id = id.replace('{','').replace('}','').toLowerCase();
        getRelatedData(formContext, id);
      }
    }

    function setFieldRequirmentLevel(formContext, fieldSchemaName, requirmentLevelValue){
      formContext.getAttribute(fieldSchemaName).setRequiredLevel(requirmentLevelValue);
    }
    
    function showOrHideField(formContext, fieldSchemaName, hideOrShowValue){
      formContext.getControl(fieldSchemaName).setVisible(hideOrShowValue);
    }

    function onChangeIsRequiredFileBit(executionContext, formContext){
      debugger;
      if(formContext == null){
        formContext = executionContext.getFormContext();
      }

      var fieldChangedSchemaName = "mtx_isrequiredfilebit";
      var fieldToModifySchemaName = "mtx_isfilerequiredforreadingbit";
      var fieldAttribute = formContext.getAttribute(fieldChangedSchemaName);
      if(fieldAttribute != null){
        var fieldValue = fieldAttribute.getValue();
        if(fieldValue == 1){
          showOrHideField(formContext, fieldToModifySchemaName, true);
          setFieldRequirmentLevel(formContext, fieldToModifySchemaName, "required");
        }
        else{
          showOrHideField(formContext, fieldToModifySchemaName, false);
			    setFieldRequirmentLevel(formContext, fieldToModifySchemaName, "none");
        }
      }
    }

    function onChangeIsSubmittedRightBit(executionContext, formContext){
      debugger;
      if(formContext == null){
        formContext = executionContext.getFormContext();
      }

      var fieldChangedSchemaName = "mtx_issubmittedrightbit";
      var fieldToModifySchemaName = "mtx_rejectedreason";
      var fieldAttribute = formContext.getAttribute(fieldChangedSchemaName);
      if(fieldAttribute != null){
        var fieldValue = fieldAttribute.getValue();
        if(fieldValue == 0){
          showOrHideField(formContext, fieldToModifySchemaName, true);
          setFieldRequirmentLevel(formContext, fieldToModifySchemaName, "required");
        }
        else{
          showOrHideField(formContext, fieldToModifySchemaName, false);
			    setFieldRequirmentLevel(formContext, fieldToModifySchemaName, "none");
        }
      }
    }

    function onSave(executionContext){
      debugger;
      var formContext = executionContext.getFormContext();
      
      var fieldToCheckSchemaName = "mtx_isfilerequiredforreadingbit";
      
      if(formContext.getAttribute(fieldToCheckSchemaName).getValue() == 0){
        alert("The required fields were not checked!");
        var saveEvent = executionContext.getEventArgs();
        saveEvent.preventDefault();
      }
    }

    function findTopicReading(formContext, fieldValue, notificationId){
      var idToFind = fieldValue[0].id;
      var idFiltered = idToFind.toString().replace("{","").replace("}","").toLowerCase();

      let baseUrl = Xrm.Page.context.getClientUrl();
      let innerUrl = "/api/data/v9.1/mtx_topicreadings(" + idFiltered + ")?";
      let selectedFields = "$select=mtx_directive";
		  let fullUrl = baseUrl + innerUrl + selectedFields;
      let isAsync = true;

      var req = new XMLHttpRequest();
      req.open("GET", fullUrl, isAsync);
      req.setRequestHeader("OData-MaxVersion", "4.0");
      req.setRequestHeader("OData-Version", "4.0");
      req.setRequestHeader("Accept", "application/json");
      req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
      req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
      req.onreadystatechange = function() {
          if (this.readyState === 4) {
              req.onreadystatechange = null;
              if (this.status === 200) {
                  var result = JSON.parse(this.response);
                  var mtx_directive = result["mtx_directive"];
                  formContext.ui.setFormNotification(mtx_directive, "WARNING", notificationId);
              } else {
                  Xrm.Utility.alertDialog(this.statusText);
              }
          }
      };
      req.send();
    }

    function OnChangeTopicRequired(executionContext, formContext){
      debugger;
      if(formContext == null){
        formContext = executionContext.getFormContext();
      }

      const fieldToCheckSchemaName = "mtx_topicrequiredid";
      const notificationId = "1";
      var fieldValue = formContext.getAttribute(fieldToCheckSchemaName).getValue();
      if(fieldValue == null){
        formContext.ui.clearFormNotification(notificationId);
      } else{
        findTopicReading(formContext, fieldValue, notificationId);
      }
    }

    function initOnChange(formContext, fieldSchemaName, functionToLink){
      let fieldAttribute = findFieldParameters(formContext, fieldSchemaName, eFieldParameters.ATTRIBUTE);
      fieldAttribute.addOnChange(functionToLink);
    }

    function initAllOnChanges(executionContext){
      var formContext = executionContext.getFormContext();
  
      initOnChange(formContext, "mtx_contactid", function() { onChangeContactId(executionContext, formContext); });
      initOnChange(formContext, "mtx_topicrequiredid", function() { OnChangeTopicRequired(executionContext, formContext); });
      initOnChange(formContext, "mtx_isrequiredfilebit", function() { onChangeIsRequiredFileBit(executionContext, formContext); });
      initOnChange(formContext, "mtx_issubmittedrightbit", function() { onChangeIsSubmittedRightBit(executionContext, formContext); });
    }

    function onLoad(executionContext){
      debugger;
		  initAllOnChanges(executionContext);

      OnChangeTopicRequired(executionContext, null);
      onChangeIsRequiredFileBit(executionContext, null);
      onChangeIsSubmittedRightBit(executionContext, null);
    }
	
    return {
      OnSave: onSave,
      OnLoad: onLoad
    };
})()