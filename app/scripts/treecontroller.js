(function ()
{
    'use strict';
    /*TODO's : adding new directory / new file button*/
    angular.module('confab')
        .controller('ApsTreeController', function ($scope, $uibModal, ZipService, StorageFactory, StaticDataFactory, IafFactory, $timeout)
        {
            console.log('TreeController...');
            var vm2 = this;
            vm2.remove = remove;
            vm2.toggle = toggle;
            vm2.setSelectedSlot = setSelectedSlot;//is a number , the id of a node file object.
            vm2.changeName = changeName;
            vm2.newSubitem = newSubitem;
            vm2.getZip = getZip;
            vm2.addFileOrFolder = addFileOrFolder;
            vm2.saveToFile= saveToFile;
            vm2.showZipDialog = showZipDialog;

            //is called in home.html
            // vm2.treeOptions =
            // {
                
            // };

            init();

            function showZipDialog()
            {

                var modalInstance = $uibModal.open(
                {
                    templateUrl : "./views/loadzipdialog.html",
                    controller : "LoadZipController as vm3",
                    size : "md",
                    resolve : {items : function ()
                        {
                            return "something";
                        }}
                });

                
                //sets listeners on the load from file and the merge buttons;
                modalInstance.rendered.then(
                function success(resp)
                {
                var zipfromfile = document.getElementById('zipfromfile');
                var mergefromfile = document.getElementById('mergefromfile');
                console.log(zipfromfile, mergefromfile);
                
                zipfromfile.addEventListener('change', function(event)
                {
                    console.log("file chosen !", event.target.files[0]);
                    $scope.$emit('fileload');//stopping the timer that saves the current window
                    modalInstance.close({returntype:"viafile"});
                    // StaticDataFactory.stopTimer();
                    ZipService.getZipFromFile(event.target.files[0]).then(function success(resp)
                    {
                        $timeout(function() //TODO StorageFactory is sometimes too late to deliver the actual keys that are in the local storage...improve by adding promises.
                        {
                            console.log("succes replacing with zip from disk...");
                            StorageFactory.initialise(); //resetting the known keys in the StorageFactory
                            vm2.list = resp;
                            console.log(vm2.list);
                            vm2.mySlots = ZipService.getMySlots();
                            var keys = Object.keys(vm2.mySlots);
                            StorageFactory.setCurrentKey(vm2.mySlots[keys[0]]);
                            setSelectedSlot({id:keys[0]});
                        }, 100);
                        //$scope.$emit('Keychange');                         

                    },function failure(err)
                    {
                        console.log("failure...", err);
                    });
                });    
                mergefromfile.addEventListener('change', function(event)
                {
                    console.log("file chosen to merge!", event.target.files[0]);
                    $scope.$emit('fileload');//stopping the timer that saves the current window
                    modalInstance.close({returntype:"mergefile"});
                    ZipService.mergeZipFromFile(event.target.files[0]).then(function success(resp)
                    {
                         $timeout(function() //TODO StorageFactory is sometimes too late to deliver the actual keys that are in the local storage...improve by adding promises.
                        {
                            StorageFactory.initialise();
                            vm2.list = resp;
                            console.log(vm2.list);
                            vm2.mySlots = ZipService.getMySlots();
                            console.log("succes merging files...", vm2.mySlots);
                            var keys = Object.keys(vm2.mySlots);
                            StorageFactory.setCurrentKey(vm2.mySlots[keys[0]]);
                            setSelectedSlot({id:keys[0]});
                            }, 100);

                        console.log("empty slot: ",StorageFactory.checkIfEmptyKey());
                    },function failure(err)
                    {
                        console.log("failure mergin files...", err);
                    });
                });

                },function failure(err)
                {
                    
                });


                modalInstance.result.then(function success(resp)
                {
                    console.log("response: " , resp.returntype);
                    if(resp.returntype === 'viahttp')
                    {
                        vm2.list = resp.data;
                        vm2.mySlots = ZipService.getMySlots();
                        var keys = Object.keys(vm2.mySlots);
                        setSelectedSlot({id:keys[0]}) ;
                        console.log(vm2.list);
                    }

                    },function failure(err)
                    {
                        console.log("no result from modal...");
                    });
            }


            function saveToFile()
            {
                ZipService.sendZip(true).then(function success(resp)
                {
                    alert("savedToFile!");    
                },
                function failure(err)
                {
                    console.log("saving to file failed...");
                });
            }

            function addFileOrFolder(item)
            {
                var thetype = (item === 'file'? false : true);


               var newobject = {
                            id: Math.floor(Math.random()*10000) ,
                            title: item + createRandomSuffix(),
                            isDirectory : thetype,
                            isLocked : false,
                            nodes: []
                            };
               vm2.list.push(newobject);
               if(item === 'file')
               {
                   StorageFactory.getNewSlotname(newobject.title, newobject.id);
                   vm2.mySlots[newobject.id] = {"title" : newobject.title,"isLocked": false};
                   setSelectedSlot(newobject);
               }
            }




            function init()
            {
                if(null !== StaticDataFactory.getReqParams())
                {
                    console.log("req params present downloading zip...") ;
                    getZip();
                }
                else
                {
                    vm2.list = StorageFactory.getGetter("thejson")();
                    vm2.mySlots = StorageFactory.getGetter("myslots")();
                    var keys = Object.keys(vm2.mySlots);
                    setSelectedSlot({id:keys[0]}) ;
                }
                // console.log("0 empty slot: ", StorageFactory.checkIfEmptyKey()); 
            }

            function getZip()
            {
                console.log("getzip...");
                ZipService.getZip().then(function success(data)
                {
                    vm2.list = data;
                    vm2.mySlots = ZipService.getMySlots();
                    var keys = Object.keys(vm2.mySlots);
                    setSelectedSlot({id:keys[0]}) ;
                    console.log(vm2.list);
                    //$timeout(changeTheNames, 1000);//waiting for the scope to have settled;otherwise view is ok but scope not parallel
                }, function fail(err)
                {
                    console.log("failure getting zip: ", err);
                });
            }

             //responding to a button click from controller.js
            $scope.$on("LoadZipEvent", function(event,value)
            {
                showZipDialog();
            });

             //responding to a button click from controller.js
            $scope.$on("SaveZipEvent", function(event,value)
            {
                saveToFile();
            });




            //listens to a button press on the key icon in the main controller and updates the model
            $scope.$on('KeySwitch', function(event, key)
            {
                var thekeys = Object.keys(vm2.mySlots);
                for(var i=0 ;i < thekeys.length; i++)
                {
                    // console.log(i , " : ", vm2.mySlots[thekeys[i]]);

                    if(vm2.mySlots[thekeys[i]].title == key.title)
                    {
                        console.log("bingo",thekeys[i]);

                        var helper = 
                        {
                            id:thekeys[i],
                            title:thekeys[i].title,
                            isLocked:thekeys,
                            nodes:[],
                            isDirectory:false
                        };

                        setSelectedSlot(helper);
                    }
                }

            });

            // $scope.$watch('vm2.selectedSlot', function()
            // {
            //     console.log("selected slot changed: ", vm2.selectedSlot);
            // });

            //Any change in the file tree is saved in localstorage to reload later
            $scope.$watch('vm2.list', function()
            {
                StorageFactory.getSetter("thejson")(vm2.list);
            }, true);

 



            function setSelectedSlot(object,fromclick) {
                console.log("changing selected slot...", object, fromclick);
                
                if(object.hasOwnProperty('id')) {
                    if(fromclick) {
                        $scope.$emit('saveOldValues');
                    }
                    vm2.selectedSlot = object.id;
                    StorageFactory.setCurrentKey(vm2.mySlots[vm2.selectedSlot]);
                    var myobj = vm2.mySlots[vm2.selectedSlot];
                    $scope.$emit('Keychange',myobj);
                }
                else {
                    if(object.$modelValue.isDirectory)
                    {
                        // console.log("draining click"); 
                        return;
                    }
                    if(!(object.isDirectory)) {
                        if(fromclick) {
                            $scope.$emit('saveOldValues');
                        }
                        vm2.selectedSlot = object.$modelValue.id;
                        StorageFactory.setCurrentKey(vm2.mySlots[vm2.selectedSlot]);
                        var myobj = vm2.mySlots[vm2.selectedSlot];
                        $scope.$emit('Keychange',myobj);
                    }
                }
            }


            /*
            Sets the name of the tree item contenteditable and places the caret; 
            On enter or on blur the nameGiver directive updates the model with the current viewvalue.
            */
            function changeName(item)
            {
                var element = document.getElementById('treeitem' + item.$modelValue.id);
                console.log("editing ",element.id);
                element.setAttribute('contentEditable', true);
                var textnode = element.firstChild;
                var caret = textnode.length;
                var range = document.createRange();
                range.setStart(textnode, 0);
                range.setEnd(textnode, caret);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                element.focus();
            }


            /*
                Removes an item from the tree after checking if the user doesn't check the last item.
                Also the corresponding slot must be deleted and the model updated accordingly.
                object one level higher in the hierarchy: object.$parentNodeScope
                siblings of the current object : object.$parentNodesScope.$modelValue   (note the small 's' difference)
            */
            function remove(object)
            {
                var theid = object.$modelValue.id;
                var parking = getRoot(object);
                var nodetype = object.$modelValue.isDirectory;
                var counter = 0;

                if(nodetype)//if it is a directory we want to remove
                {
                    var currentLayer = object;

                    // while(currentLayer !== null && counter < 10)
                    // {
                          // if(lookForDirectory(currentLayer.$parentNodesScope.$modelValue, object.$modelValue.id))
                            // {
                                console.log("removable: ", object.$modelValue.title);
                                var results = deleteContainingFiles(object);
                                console.log("results: ",results );
                                
                                //checking for the case that no files are left after this deletion
                                //updating the mySlots object with the current slots.
                                if(results.length < Object.keys(vm2.mySlots).length)
                                {   
                                    results.forEach(function(item)
                                    {
                                        deleteFromLocalStorage(item);
                                        delete vm2.mySlots[item];
                                    });
                                    object.remove();
                                }
                                // break;
                            // }
                          // else
                          // {
                          //   currentLayer = currentLayer.$parentNodeScope;
                          //   console.log("watching layer above" ,currentLayer );
                          // }    
                          // counter++;
                    // }
                }
                else//if it is a file we want to remove
                {
                    if(traverseArray(parking.$parentNodesScope.$modelValue, false))
                    {
                        console.log("removable: ", object.$modelValue.title);
                        deleteFromLocalStorage(object.$modelValue.id);
                        delete vm2.mySlots[object.$modelValue.id]; //remove from the slots
                        object.remove(); //remove from the filetree
                    }
                }

                function deleteFromLocalStorage(itsid)
                {
                    var thealias = vm2.mySlots[itsid].title;
                    var theslot = StorageFactory.getGetter(thealias)();
                    console.log("removing slots:",theslot, " alias " ,thealias);
                    StorageFactory.getSetter(thealias)();
                    StorageFactory.getSetter(theslot)();
                    var myslots = StorageFactory.getGetter("myslots")();
                    delete myslots[itsid];
                    StorageFactory.getSetter("myslots")(myslots);
                }


                function deleteContainingFiles(object)
                {
                    var results = [];
                    console.log("children:", object.$childNodesScope.$modelValue);
                    var array = object.$childNodesScope.$modelValue;

                    findResults(array);

                    function findResults(sublist)
                    {
                        for(var i=0 ; i< sublist.length; i++)
                        {
                            if(!(sublist[i].isDirectory))
                            {
                                results.push(sublist[i].id);
                            }
                            else
                            {
                                if(sublist[i].nodes.length > 0)
                                {
                                    findResults(sublist[i].nodes);   
                                }
                            }
                        }
                    }

                    console.log("id of selected slot :", vm2.selectedSlot); 

                    checkingloop : for (var j=0 ; j<results.length ; j++)
                    {

                        if(vm2.selectedSlot === results[j])
                        {
                            console.log("selected file inside directory", vm2.selectedSlot); 
                            //finding an id that is outside this directory make that the selected slot:
                            var keys = Object.keys(vm2.mySlots);
                            var found = false;
                            for(var l=0 ; l<keys.length; l++)
                            {
                                if(!_.contains(results, keys[l]))
                                {
                                    setSelectedSlot({id:keys[l]});
                                    found = true;
                                    break checkingloop;
                                }
                            }
                            if (!found)
                            {
                                console.log("no files left to assign current file...") 
                            }    
                        }
                    }


                    return results;  
                }

                function getRoot(obj)
                {
                    var parking = obj;
                    while(parking.$parentNodeScope !== null)
                    {
                        parking = parking.$parentNodeScope ;
                    }
                    console.log("root:", parking.$parentNodesScope.$modelValue);
                    return parking;
                }

                function traverseArray(sublist, ok)
                {
                    
                    if(ok){return ok;}
                    for(var i = 0 ; i<sublist.length; i++)
                    {
                        console.log(sublist[i].title,sublist[i].id);
                        if(!(sublist[i].isDirectory) && sublist[i] !== object.$modelValue) 
                        {
                            console.log("match with", sublist[i].title);
                            ok = true;
                            break;
                        }
                        else
                        {
                            if(sublist[i].nodes.length > 0)
                            {
                                ok = traverseArray(sublist[i].nodes, ok);
                            }
                        }
                    }
                    return ok;
                } 
                // Looking for a directory that is still present
                function lookForDirectory(sublist, callerid)
                {
                    for (var i = 0 ; i < sublist.length ; i ++)
                    {
                        if(sublist[i].isDirectory && sublist[i].id !== callerid)
                        {
                            console.log("found directory" , sublist[i].title);
                            return true;
                        }
                    }
                }
            }

            function toggle(item)
            {
               item.toggle();
            }

            function newSubitem(item)
            {
                //console.log("parent:",item.$parent.$parent.$parent.$parent.$modelValue.title);
                var theitem = item.$modelValue;
                console.log(theitem);

                if(theitem.isDirectory)
                {
                    theitem.nodes.push({
                    id: Math.floor(Math.random()*10000) ,
                    title: theitem.title ,
                    isDirectory : true,
                    nodes: []
                    });
                }
                else
                {
                    var theid = Math.floor(Math.random()*10000);
                    var thetitle = theitem.title + '-' + createRandomSuffix();
                    var newobject = {
                            id: theid ,
                            title: thetitle,
                            isDirectory : false,
                            isLocked : false,
                            nodes: []
                            };


                    if(item.$parentNodeScope !== null)
                    {
                        item.$parentNodeScope.$modelValue.nodes.push(newobject);
                    }
                    else
                    {
                        vm2.list.push(newobject);
                    }
                    // console.log("item:", item);
                    // console.log("theid ", theid);
                    StorageFactory.getNewSlotname(thetitle, theid);
                    vm2.mySlots[theid] = {"title" : thetitle,"isLocked": false};
                    setSelectedSlot(newobject);
                }
            }


            function createRandomSuffix()
            {
                var suffixes = "abcdefghijklmnopqrstuvwxyzABCDEFGHILJKLMNOPRSTUVWXYZ";
                var result = "";
                for(var i=0 ; i<3; i++)
                {
                    var randomdigit = Math.floor(Math.random()*suffixes.length);
                    var letter = suffixes.substring(randomdigit,randomdigit + 1);
                    result += letter;
                }
                return result;
            }


        })

        //controls the modal that appears when you're loading a zip
        .controller('LoadZipController', function($uibModalInstance, $scope, ZipService, items)
            {
                var vm3 = this;
                vm3.closeModal = closeModal;
                vm3.getZipOverHttp = getZipOverHttp;

                function getZipOverHttp()
                {
                    console.log("getzip over http...");
                    $scope.$emit('fileload');//stopping the timer that saves the current window
                    ZipService.getZip().then(function success(data)
                    {
                        console.log("data back", data);
                        $uibModalInstance.close({returntype:"viahttp",data:data});
                        
                    }, function fail(err)
                    {
                        console.log("failure getting zip via http: ", err);
                    });
                }                

                

                function closeModal()
                {
                    $uibModalInstance.close("dialog cancelled.");
                }
            })



        //Returns the part after the last slash of a file.
        .filter('cropFilter', function()
        {
            return function(item)
            {
                if(item === undefined || item === null) return "";
                var helper = item.substring(item.lastIndexOf('/') + 1 ,item.length);
                if(helper.length > 0)
                {
                    return helper;
                }
                else
                {
                    return item;
                }
            };
        });

})();
