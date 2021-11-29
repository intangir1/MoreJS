function incidentChangeOwnerRibbon(primaryControl)
{
    var formContext = primaryControl;
	
	var parameters = {};
	var entity = {};
	entity.id = formContext.data.entity.getId().replace('{', '').replace('}', '');
	entity.entityType = "incident";
	parameters.entity = entity;

	var msdyn_GetCaseSuggestionsRequest = {
		entity: parameters.entity,

		getMetadata: function() {
			return {
				boundParameter: "entity",
				parameterTypes: {
					"entity": {
						"typeName": "mscrm.incident",
						"structuralProperty": 5
					}
				},
				operationType: 0,
				operationName: "mtx_changeOwner"
			};
		}
	};

	Xrm.WebApi.online.execute(msdyn_GetCaseSuggestionsRequest).then(
		function success(result) {
			if (result.ok) {
				formContext.data.refresh(true).then(function success(){} , function error(){});
			}
		},
		function(error) {
			console.log(error);
		}
	);
};