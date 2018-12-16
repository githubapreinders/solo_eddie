(function()
{
	'use strict';
	 var appl = angular.module('confab');
	//TODO add a view and controller functionality to add items to the children array
	appl.controller('ModeratorController', function($scope, StaticDataFactory, $uibModal, $timeout, StorageFactory, ModeratorFactory, UserFactory)
	{
		var vm3 = this;
		vm3.showModel = showModel;
		vm3.deleteProperty = deleteProperty;
		vm3.changeAttr = changeAttr;
		vm3.addProperty = addProperty;
		vm3.addNewClass = addNewClass;
		vm3.saveItem = saveItem;
		vm3.postJsonBulk = postJsonBulk;
		vm3.confirmDelete = confirmDelete;
		vm3.newSnippet = newSnippet;
		
		vm3.user = UserFactory.getCurrentUser();
		vm3.thexml = null;

		//vm3.dataModel = JSON.parse(StaticDataFactory.getStaticJson());
		console.log(vm3.dataModel);
		vm3.currentSlotNumber = null; //TODO extract slots from localstorage
		vm3.showPropertyDescription= false;
		vm3.selectedProperty = 0;
		vm3.addingProperty = false;
		vm3.newProperty = null;
		vm3.addingItem = false;
		vm3.slotlist=[];
		var helper = StorageFactory.getListOfFiles();
		helper.forEach(function(val)
		{
			vm3.slotlist.push({file:val});
		});

		vm3.file={};
		// vm3.selectedFile=vm3.slotlist[0];
		// console.log("files", vm3.slotlist);

		// if (vm3.dataModel === null)
		// {
		console.log("resolving data from iaf data:" );

		StaticDataFactory.getJson().then(function success(response)
		{
			$('#theprops').mCustomScrollbar({theme:"minimal"});
			$('#xmlwrapper1').mCustomScrollbar({theme:"minimal"});
			$('#xmlwrapper2').mCustomScrollbar({theme:"minimal"});
			console.log("response",response);
			var helper = JSON.parse(response.data.JSONMONSTER.MYMONSTER);
			vm3.dataModel = [];
			Object.keys(helper).forEach(function(value)
			{
				vm3.dataModel.push(helper[value]);
			});
			vm3.selectedItem = vm3.dataModel[0];
			// console.log("data", vm3.selectedItem, vm3.dataModel);
		},
		function error(err)
		{
			console.log("error");
		});
		// }
		// else
		// {
		// 	$('propArea').mCustomScrollbar({theme:"minimal"});
		// 	vm3.selectedItem = StaticDataFactory.getSelectedItem();
		// 	console.log("data", vm3.selectedItem, vm3.dataModel);
		// }


		function newSnippet()
		{
			console.log("chosen  file :", vm3.file.selected.file, vm3.file);
			var slot = StorageFactory.getGetter(vm3.file.selected.file)();
			var thename = cropFilter(vm3.file.selected.file);
			thename = thename.split('.')[0];
			if (thename === null)
			{
				thename = slot;
			}
			vm3.thexml = StorageFactory.getGetter(slot)();
			vm3.newProperty = null;
			vm3.addingProperty = false;
			vm3.addingItem = true;
			vm3.dataModel.push({classname:thename,description:"enter your description here", type:"snippets",xml:vm3.thexml, attrs:{},properties:[]});
			vm3.selectedItem = vm3.dataModel[vm3.dataModel.length-1];
			console.log("thename: ", vm3.dataModel);
		}

		function cropFilter(item)
        {
            if(item === undefined) return "";
            var helper = item.substring(item.lastIndexOf('/') + 1 ,item.length);
            if(helper.length > 0)
            {
                return helper;
            }
            else
            {
                return item;
            }
        }


		function postJsonBulk()
		{
			ModeratorFactory.postJsonBulk(vm3.selectedItem.description);
		}

		

		function deleteItem()
		{
			toggleSpinner();
			ModeratorFactory.deleteItem(vm3.selectedItem.classname).then(function succcess(res)
			{
				console.log(res);
				toggleSpinner();
				var el = document.getElementById('sendstatususers');
                el.style.background = 'green';
                $timeout(function()
                {
                    el.style.background = 'none';
                }, 5000);
				console.log("success",res);
				var parking = vm3.selectedItem.classname;
				delete vm3.dataModel[parking];
				vm3.selectedItem = vm3.dataModel[Object.keys(vm3.dataModel)[0]];
			},
			function fail(err)
			{
				console.log(err);
                toggleSpinner();
				var el = document.getElementById('sendstatusmod');
                el.style.background = 'red';
                $timeout(function()
                {
                    el.style.background = 'none';
                }, 5000);
			});
		}

		function postJsonMonster()
		{
			console.log("JSONMONSTER\n",JSON.stringify(vm3.dataModel));
		}



		function addNewClass()
		{
			vm3.newProperty = null;
			vm3.addingProperty = false;
			vm3.addingItem = true;
			vm3.dataModel.push({classname:"NEWITEM", description:"enter your description here", type:"general",xml:"", attrs:{},properties:[]})
			vm3.selectedItem = vm3.dataModel[vm3.dataModel.length-1];
		}


		function changeAttr(index)
		{
			vm3.selectedItem.attrs[vm3.selectedItem.properties[index][0]] = new Array(vm3.selectedItem.properties[index][2]);
		}

		function addProperty(string)
		{
			switch(string)
			{
				case 'add':
				{
					vm3.newProperty = {propname:"new_property",propdes:"replace with your description",propdef:""};
					break;
				}
				case 'cancel':
				{
					vm3.newProperty = null;
					break;
				}
				case 'confirm':
				{
					if(vm3.newProperty.propname === "" || vm3.newProperty.propdes === "")
					{
						return;
					}
					vm3.selectedItem.attrs[vm3.newProperty.propname] = new Array(vm3.newProperty.propdef);
					vm3.selectedItem.properties.unshift(new Array(vm3.newProperty.propname,vm3.newProperty.propdes,vm3.newProperty.propdef));
					vm3.newProperty = null;
					break;
				}
				default:
				{
					break;
				}
			}
		}

		function toggleSpinner()
		{
			vm3.showSpinner = !vm3.showSpinner;
		}

		function deleteProperty(index)
		{
			console.log("deleting property", index, vm3.selectedItem.properties[index][0]);
			delete vm3.selectedItem.attrs[vm3.selectedItem.properties[index][0]];
			vm3.selectedItem.properties.splice(index,1);
		}

		function showModel()
		{

			//vm3.displayItem = JSON.stringify(vm3.selectedItem,['properties'],4);
			//console.log(vm.displayItem);
			var modalInstance = $uibModal.open(
			{
				templateUrl : "./views/itemcontents.html",
				controller : "ModalController as vm5",
				windowClass : "mymodal",
				resolve : {items : function ()
					{
						return vm3.selectedItem;
					}}
			});
		}

		function saveItem()
		{
			toggleSpinner();
			ModeratorFactory.postDatamonster(vm3.dataModel,vm3.selectedItem).then(function success(res)
			{
				toggleSpinner();
				var el = document.getElementById('sendstatusmod');
                el.style.background = 'green';
                $timeout(function()
                {
                    el.style.background = 'none';
                }, 5000);
				console.log("success",res);
			}, 
			function fail(err)
			{
				toggleSpinner();
				var el = document.getElementById('sendstatusmod');
                el.style.background = 'red';
                toggleSpinner();
                $timeout(function()
                {
                    el.style.background = 'none';
                }, 5000);
				console.log("fail",err);
			});
		}


		function confirmDelete()
		{

			var modalInstance = $uibModal.open(
			{
				templateUrl : "./views/modal_delete_item.html",
				animation : true,
				controller : "Modal2Controller as vm6",
				size : "sm",
				backdrop : "static",
				resolve : 
				{
					item : function ()
					{
						return vm3.selectedItem;
					}
				}
			}).result.then(function(result)
			{
				console.log("result:", result);
				if(result === 'delete')
				{
					toggleSpinner();
					ModeratorFactory.deleteItem(vm3.selectedItem.classname).then(function succcess(res)
					{
						toggleSpinner();
						var parking = vm3.selectedItem.classname;
						console.log("response from service: ", res, parking);
						var index = -1;
						for(var i=0 ; i<vm3.dataModel.length; i++)
						{
							console.log("iterating",vm3.dataModel[i].classname);
							if(vm3.dataModel[i].classname === parking)
							{
								index = i;
								console.log("deleted index...", index);
								break;
							}
						}
						
						if(index !== -1)
						{
							delete vm3.dataModel[index];
						}
						vm3.selectedItem = vm3.dataModel[Object.keys(vm3.dataModel)[0]];
						saveItem();
					},
					function fail(err)
					{
						toggleSpinner();
						console.log(err);
					});
				}
			});
		}

	})
	
	.controller('ModalController', function($uibModalInstance, items)
	{
		var vm5 = this;
		vm5.closeModal = closeModal;
		vm5.items = JSON.stringify(items,null, 4);

		function closeModal()
		{
			$uibModalInstance.close();

		}
	})

	.controller('Modal2Controller', function($uibModalInstance, item)
	{
		var vm6 = this;
		vm6.closeModal = closeModal;
		vm6.deleteItem = deleteItem;
		vm6.item = item;

		function closeModal()
		{
			$uibModalInstance.close("cancel");
		}

		function deleteItem()
		{
			$uibModalInstance.close("delete");
		}
	});
}());