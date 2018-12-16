(function()
{
	'use strict';

angular.module('confab')

/*Part of the file navigator (node_template.html) changing the name of a file of directory neeeds to be updated
In local storage. For this the old and the new name have to be in one place.*/
.directive('nameGiver', function(StorageFactory)
        {
            return{
                restrict:"A",
                link : function(scope, el , attrs)
                {
                    

                    el.bind('blur' , function(event)
                    {
                        var digit = event.target.id.match(/\d+/g)[0];
                        console.log("digit", digit, event.target.id);
                        var element = document.getElementById('treeitem' + digit);
                        var text = element.innerHTML;
                        var thelist = scope.vm2.list;
                        console.log("text",text, thelist, digit);
                        traverseArray(thelist);

                        function traverseArray(sublist)
                        {
                            for(var i = 0 ; i<sublist.length; i++)
                            {

                                console.log(sublist[i].title,sublist[i].id);
                                //compares int with a string, so NOT === in the comparator
                                if(sublist[i].id == digit) 
                                {

                                    /*check if there's no sibling node with the same title, otherwise
                                    we will get name collisions and data loss in the local storage*/
                                    var theobject = angular.element(element).scope();
                                    // console.log("siblings: ", theobject.$parentNodesScope.$modelValue);
                                    var siblings = theobject.$parentNodesScope.$modelValue;
                                    for(var s = 0 ; s < siblings.length; s++)
                                    {
                                        if(siblings[s].title == text)
                                        {
                                            element.innerHTML = cropFilter(theobject.$modelValue.title);
                                            alert("please no double names in this directory!");
                                            return;
                                        }
                                    }

                                    sublist[i].title = text;
                                    // console.log("match", sublist[i], text, scope.vm2.mySlots);
                                    if(!(sublist[i].isDirectory))
                                    {
                                        //changing a filename changes the alias of a storageslot;
                                        //"oldname:slot1" has to become "newname:slot1"
                                        var theslot = StorageFactory.getGetter(scope.vm2.mySlots[digit].title)();
                                        var oldalias = scope.vm2.mySlots[digit].title;
                                        StorageFactory.changeKeys(oldalias,text);//keeping track of keys array and currentkey
                                        StorageFactory.getSetter(oldalias)();//removing old alias
                                        StorageFactory.getSetter(text)(theslot);//adding the new value
                                        scope.vm2.mySlots[digit].title = text; //updating the current working files
                                        var myslots = StorageFactory.getGetter("myslots")();
                                        myslots[digit].title = text;
                                        StorageFactory.getSetter("myslots")(myslots);//updating the working files in localstorage
                                    }
                                    element.setAttribute('contentEditable', false);
                                    scope.$apply();
                                    StorageFactory.getSetter("thejson")(scope.vm2.list);//saving changed json
                                    break;
                                }
                                if(sublist[i].nodes.length > 0)
                                {
                                    traverseArray(sublist[i].nodes);
                                }
                            }
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


                    });
                    el.bind('keydown',function(event)
                    {
                        var code = event.which || event.keyCode || eventt.charCode ;
                        if (code === 13)// enter key
                        {
                            event.preventDefault();
                            var element = document.getElementById('treeitem'+event.target.id.match(/\d+/g));
                            element.blur();
                        } 
                    });
                }
            };
        })

.directive('propertyListener', function(attributeObject)
{
	
	return{
		link : function(scope, elem, attrs)
		{
			elem.bind('click', function(event)
			{
				var heading = document.getElementById('propertyheader');
				var text = document.getElementById('propertytext');
				console.log("clicked property", event.target.id, heading.innerHTML);
				var itemnumber = event.target.id.match(/\d+$/)[0];
				var data = scope.vm.selectedItem.properties[itemnumber];
				heading.innerHTML = data[0];
				text.innerHTML = data[1];

				var elemt = document.getElementById('checkbox' + itemnumber);
				var input = document.getElementById('propertyvalue' + itemnumber);
				var item = scope.vm.selectedItem;

				console.log("items:", elemt, input, item);

				/* a checked checkbox will be written onto vm.selectedProperties,
				when it is unchecked we will want to remove it from there. */
				
				if(typeof (elemt) === 'object')
					switch (elemt.checked)
					{
						case true :
						{
							console.log("adding ...");
							scope.vm.selectedProperties[data[0]] = new attributeObject(data[0], new Array(input.value));
							break;
						}

						case false : 
						{
							console.log("deleting ...");
							delete scope.vm.selectedProperties[data[0]];
							break;
						}
					}
				console.info("selected properties",scope.vm.selectedProperties);
                scope.vm.showTagInTooltip();
			});
		}

	};
})


/*event: set up a function that starts in 1000ms; in this function the position of the
popup is calculated; starttime is noted */

.directive('popupPlacement',function($timeout)
{
    return{
        restrict:"A",
        link: function (scope, element, attrs)
        {
         var mytimer;
         var oldtime = Date.now();   
           element.bind('scroll',function(event)
           {
                var starttime = Date.now();
                if(starttime - oldtime > 1000)
                {
                    startCalc();
                    oldtime = starttime;
                }
                else
                {
                    try {
                        mytimer.cancel();
                    } catch(e) {
                        console.log(e);
                    }
                    oldtime = starttime;
                }
               });

                function startCalc()
                {
                    
                    mytimer = $timeout(function()
                    {
                        var containerbottom = document.getElementsByClassName('descriptionArea')[0].getBoundingClientRect().bottom;
                        console.log("starting function...");
                        var hasprop = true;
                        var index = 0;
                        var element;
                        while(hasprop)
                        {
                            var propname = "popover" + index;
                            element = document.getElementById(propname);
                            if(element)
                            {
                                var theelementtop =  element.getBoundingClientRect().top;
                                var difference = theelementtop - containerbottom;
                                console.log("difference", propname," ", difference);
                                if(difference > 0 && difference < 300 )
                                {
                                    console.log("bottom");
                                    element.setAttribute('popover-placement','bottom-left');
                                }
                                else
                                {
                                    console.log("top");
                                    element.setAttribute('popover-placement','top-left');
                                }
                                index++;
                            }
                            else
                            {
                                console.log("no element...");
                                hasprop = false;
                            }
                        }
                    },1000);


                }
        }
    };
})

	/* 
	 when the change on the contenteditable happens the model binding has to
     be invoked; also the property is a key in the attrs object ; so the old key name
     is replaced by the new one here since at this place only the old and the new
     value come together.
     */
.directive("contenteditable", function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {
        ngModel.$setViewValue(element.html());
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };
      
      element.bind("keyup change", function(event) 
      {
        console.log("changing property......");
        var el = event.target.id;
        if(el !== 'newproperty' && el !== 'newclassname' && el !== 'newdescription')
        {
	        var oldvalue = scope.vm3.selectedItem.properties[scope.vm3.selectedProperty][0];
	        scope.$apply(read);
	        var newvalue = scope.vm3.selectedItem.properties[scope.vm3.selectedProperty][0];
	        var theattrs = scope.vm3.selectedItem.attrs;
	        if(newvalue !== oldvalue)
	        {
	        	Object.defineProperty(theattrs, newvalue,
	        	Object.getOwnPropertyDescriptor(theattrs, oldvalue));
	        	delete theattrs[oldvalue];
	        }
        }
        else if(el !== 'newclassname'){
            console.log("new  name for item: ", el);
        	//scope.$apply(read);
        }
      });
      element.bind("blur", function(event) 
      {
        console.log("changing classname......");
        var el = event.target.id;
        
        if(el === 'newclassname') 
        {
            var oldvalue = (scope.vm3.selectedItem.classname);
            scope.$apply(read);
            var newvalue = (scope.vm3.selectedItem.classname);
            delete scope.vm3.dataModel[oldvalue];
            scope.vm3.dataModel[newvalue] = scope.vm3.selectedItem;
        }      
        else{
            scope.$apply(read);
        }
      });

    }
  };
});



}());