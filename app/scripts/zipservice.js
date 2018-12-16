(function()
{
  'use strict';
  var app = angular.module('confab'); 
  app.

  factory('ZipService', function (StorageFactory, StaticDataFactory, $http , UPLOAD_URL, IAF_URL, $window)
     {

      console.log("ZipService.js...");

        var PROJECTNAME; 
        var myslots;
        var instancename = null;
        var version = null;
       
        return {
            init : init,
            getSlots : getSlots,
            getZip : getZip,
            getZipFromFile : getZipFromFile,
            sendZip : sendZip,
            getMySlots : getMySlots,
            mergeZipFromFile : mergeZipFromFile
        };

        function init()
        {
            return StorageFactory.getGetter("thejson")();
        }

        function getSlots()
        {
            return StorageFactory.getGetter("myslots")();
        } 

        function getMySlots()
        {
            return myslots;
        } 

        function sendZip(saveas)
        {
                return new Promise(function(resolve, reject)
                {
                  PROJECTNAME = StaticDataFactory.getProjectName();
                  console.log("projectname....", PROJECTNAME);
                  var zip = new JSZip();
                  var elements = document.querySelectorAll('[ui-tree-node]');
                
                //each tree element gets a filename and we grab the content from storage
                elements.forEach(function(item)
                {
                    var object = angular.element(item).scope();
                    var parents = [];

                    while(object.$parentNodeScope !== null)
                    {
                        parents.push(object.$parentNodeScope.$modelValue.title);
                        object = object.$parentNodeScope;
                    }
                    //console.log("parents of...", object.$modelValue.title,"\n",parents);       

                    var filename = "";
                    while(parents.length > 0)
                    {   
                        filename += cropFilter(parents.pop()) + '/';
                        // console.log("filename: ", filename, "\n");
                    }
                    

                    // Het framework wil een configuration file perse met rootfolder hebben, zodoende dit onlogische stukje.
                    //"Ibis4Student/" +
                    if(cropFilter(angular.element(item).scope().$modelValue.title) === 'Configuration.xml')
                    {
                      
                      filename = PROJECTNAME + "/Configuration.xml";

                      //filename = "Ibis4Student/Configuration.xml";
                    }
                    else
                    {
                      
                      filename =  filename + cropFilter(angular.element(item).scope().$modelValue.title) ;
                    }
                    // console.log("filename finally: ", filename, "\n\n");

                    if(angular.element(item).scope().$modelValue.isDirectory)
                    {
                        // console.log("adding directory", angular.element(item).scope().$modelValue);
                        zip.folder(filename);
                    }
                    else
                    {   
                        var theslot = StorageFactory.getGetter(angular.element(item).scope().$modelValue.title)();
                        zip.file(filename,StorageFactory.getGetter(theslot)());
                    }
                });
                var timestamp = Date.now();
                var text = "configuration.version=" + timestamp;
                zip.file("BuildInfo_SC.properties" , text);

                console.log("Zipfile ", zip);
                //takes a path pattern and returns the last part: "dir1/subdir2/myfile.txt" => "myfile.txt"
               
               
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

                if(saveas)//responding to the save button in the treeview using file-saver API
                {
                  console.log("saving as a zip file...");
                  zip.generateAsync({type:"blob"}).then(function(myzip)
                  {
                    var blob = new Blob([myzip],{type:"application/zip"});
                    console.log("generated a zip...", blob);
                    saveAs(blob, "configuration.zip");
                    resolve();
                  });
                }
                else //sending zip file to IAF
                {
                  postConfig(zip, timestamp).then(function success(resp)
                  {
                    console.log("returning from postconfig");
                    resolve(resp);
                  },function failure(err)
                  {
                    console.log("returning error from postconfig");
                    reject(err);
                  });
                }
                });
        }


        function postConfig(zip, timestamp)
        {
          return new Promise(function(resolve, reject)
          {

          PROJECTNAME = StaticDataFactory.getProjectName();
            var finalurl = IAF_URL + UPLOAD_URL;
            
           
            if( null !== StaticDataFactory.getReqParams())            
            {   
              var params = StaticDataFactory.getReqParams();
              PROJECTNAME = params.instancename;
              timestamp = params.version;
              console.log("modifying version and projectname: " , finalurl, PROJECTNAME, timestamp );
            }
            
            zip.generateAsync({type:"blob"}).then(function(myzip)
            {
              var fileName = 'configuration.zip';
              var fd = new FormData();
              

              fd.append("realm", 'jdbc');
              //fd.append("name", "Ibis4Student");
              fd.append("name", PROJECTNAME);
              fd.append("version", timestamp);
              fd.append("encoding", 'utf-8');
              fd.append("multiple_configs", false);
              fd.append("activate_config", true);
              fd.append("automatic_reload", true);
              fd.append("file", myzip, fileName);

              console.log("posting to iaf", myzip);
              $http({method: 'POST',url:finalurl , data: fd , headers:{'Content-type': undefined}})
              .then(function succes(response)
              {
                  console.info("returning from backend",response);
                  if( null !== StaticDataFactory.getReqParams())            
                  {  
                  var firstpart = window.location.href.split('editor')[0];
                  var secondpart = "gui/#/configurations/manage/";
                  var thirdpart = StaticDataFactory.getReqParams().instancename;
                  var theurl = firstpart + secondpart + thirdpart;
                  console.log("switching back to console view: ", theurl);  
                    window.location.assign(theurl);
                  }
                  resolve (response);
              }, function failure(err)
              {
                  console.info("returning error from backend",err);
                  reject(err);
              });

              });//end of JSZIP promise

            });//end of new promise

        }

        /*
      Replaces the current File Browser contents with a zip from the local drive.
        */
        function getZipFromFile(file)
        {
          return JSZip.loadAsync(file).then(function(zip)
            {
              console.log("loadasync from file...", zip);
              StorageFactory.deleteAll();
              var myzipfiles = [];
              
              //removing unwanted entries
              zip.forEach(function(relativePath, file)
              {
                if(file.name.substring(0,2) !== '__' && file.name !== PROJECTNAME +'/' && file.name !== 'BuildInfo_SC.properties')
                {
                  myzipfiles.push(file);
                }
              });
              
              //removing an unwanted wrapper directory ('PROJECTNAME/Configuration.xml becomes 'Configuration.xml')
              for(var i=0 ; i< myzipfiles.length; i++)
              {
                if(myzipfiles[i].name.indexOf(PROJECTNAME) > -1)
                      {
                        console.log("slicing out", myzipfiles[i].name);
                        var item = myzipfiles[i].name;
                        var helper = item.substring(item.lastIndexOf('/') + 1 ,item.length);
                        myzipfiles[i].name = helper;
                      }
              }

              /*Write to local storage; to avoid collisions, the calls
              are made synchronously.*/
              storeZip(0);
              
              function storeZip(index)
              {
                if(index > myzipfiles.length-1)
                {
                  return;
                }
                else
                {
                  if(!(myzipfiles[index].dir))
                  {
                    myzipfiles[index].async("string").then(function resolve(data)
                    {
                        var newslotname = "slot" + Math.ceil(Math.random()*1000);
                        console.log("data length",myzipfiles[index].name, data.toString().length);
                        StorageFactory.getSetter(myzipfiles[index].name)(newslotname);
                        StorageFactory.getSetter(newslotname)(data);
                        index++;
                        storeZip(index++);
                    });
                  }
                  else
                  {
                    index++;
                    storeZip(index);
                  }
                }
              }                              

              console.log("loaded zipfiles",myzipfiles);
              var myjson=[];
              myslots = {};

              //creation of a flat json structure              
              for( i =0 ; i< myzipfiles.length ; i++)
              {
                if(myzipfiles[i].dir)
                {
                    myjson.push({
                    id : Math.ceil(Math.random() * 10000),  
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name.substring(0,myzipfiles[i].name.length-1),
                    nodes : []
                    });
                }
                else
                {
                  var myobj = {
                    id : Math.ceil(Math.random() * 10000),
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name,
                    nodes : []
                    };
                  myjson.push(myobj);
                  myslots[myobj.id] = {title:myobj.title, isLocked:false};
                }
              }

              //sorting the array: highest amount of nodes first .
              myjson.sort(function compare(val1, val2)
              {
                if(val1.title.split('/').length > val2.title.split('/').length)
                {
                  return -1;
                }
                if(val1.title.split('/').length < val2.title.split('/').length)
                {
                  return 1;
                }
                return 0;
              });

                var helper5 = 0;//emergency variable to prevent a possible eternal loop
                var parentsfound = true; //escapes the while loop when we had a run with no results

                
                /*
                adding children to the parents node arrays; when there is a parent found myjson is changed
                and we will start the loop again
                */
                while(parentsfound &&  helper5 <100)
                {
                  parentsfound = false;
                  var copy = myjson;

                  for(var index = 0 ; index < myjson.length; index ++)
                  {
                    for(var j=0 ; j< copy.length; j++)
                    {
                      if(isParent(myjson[index].title, copy[j].title))
                      {
                        // console.log(myjson[index].title, "direct parent of " ,copy[j].title);
                        // console.log("myjson",myjson);
                        myjson[index].nodes.push(copy[j]);
                        myjson.splice(j,1);
                        parentsfound = true;
                        break;
                      }
                    }
                    if(parentsfound)
                    {
                      break;
                    }
                  }
                  helper5 ++;
                }
               


                /* Main helper function of the recursive loop; "dir1/dir2/file1.abc" compared with "dir1/dir2" will
                regard this as a direct parent-child relationship. */ 
                function isParent(possibleparent, candidate)
                {
                  if(possibleparent === candidate)
                  {
                    return false;
                  }
                  var index = candidate.lastIndexOf('/');
                  if(candidate.substring(0,index) === possibleparent)
                  {
                    return true;
                  }
                  else
                  {
                    return false;
                  }
                }

                console.log("generated json out of zip:\n",myjson);

                //saving json and working files structure to local storage, and returning to the caller
                StorageFactory.getSetter('thejson')(myjson);
                StorageFactory.getSetter('myslots')(myslots);  
                return(myjson); 

              });//end of jszip async call
        }



        /*
      Adds a zip file to the current tree.
        */
      function mergeZipFromFile(file)
        {
          return JSZip.loadAsync(file).then(function(zip)
            {
              PROJECTNAME = StaticDataFactory.getProjectName();
              console.log("loadasync from file...", zip);
              
              var myzipfiles = [];
              
              //removing unwanted entries
              zip.forEach(function(relativePath, file)
              {
                if(file.name.substring(0,2) !== '__' && file.name !== PROJECTNAME +'/' && file.name !== 'BuildInfo_SC.properties')
                {
                  myzipfiles.push(file);
                }
              });
              
              //removing an unwanted wrapper directory ('Ibis4Student/Configuration.xml becomes 'Configuration.xml')
              for(var i=0 ; i< myzipfiles.length; i++)
              {
                if(myzipfiles[i].name.indexOf(PROJECTNAME) > -1)
                      {
                        console.log("slicing out", myzipfiles[i].name);
                        var item = myzipfiles[i].name;
                        var helper = item.substring(item.lastIndexOf('/') + 1 ,item.length);
                        myzipfiles[i].name = helper;
                      }
              }


              /*
          Searching for  possible duplicate directory names
              */
              var dirs = StorageFactory.getListOfDirectories();
              var duplicates = [];
              for ( i = 0 ; i < myzipfiles.length; i++)
              {
                  if(dirs.includes(myzipfiles[i].name))
                  {
                    duplicates.push(myzipfiles[i].name);
                  }
              }

              duplicates.sort(function compare (dup1, dup2)
              {
                if(dup1.split('/').length > dup2.split('/').length)
                {
                  return 1;
                }

                else if(dup1.split('/').length === dup2.split('/').length)
                {
                  return 0;
                }

                else 
                {
                  return -1;
                }

              });

              //changing duplicate names in the zipfile
              duplicates.forEach(function(duplicate)
              {
                var suffix = '(1)';
                myzipfiles.forEach(function(zipfile)
                {
                  if(zipfile.name.includes(duplicate))
                  {
                    zipfile.name = zipfile.name.replace(duplicate, duplicate.substring(0,duplicate.length -1) + suffix + '/');
                  }
                });

              });

              var files = StorageFactory.getListOfFiles();
              files.forEach(function(filename)
              {
                var suffix = '(1).';
                for(i=0 ; i < myzipfiles.length; i++)
                {
                  if(myzipfiles[i].name === filename)
                  {
                  console.log("bingo");
                    if(myzipfiles[i].name.split('.').length > 0)
                  {
                    myzipfiles[i].name = myzipfiles[i].name.split('.')[0] + suffix + myzipfiles[i].name.split('.')[1];
                  }
                  else
                  {
                    myzipfiles[i].name = myzipfiles[i].name + createRandomSuffix();
                  }
                  }
                }
              });


              /*Write to local storage; to avoid collisions, the calls
              are made synchronously.*/
              
              storeZip(0);
              function storeZip(index)
              {
                if(index > myzipfiles.length-1)
                {
                  return;
                }
                else
                {
                  if(!(myzipfiles[index].dir))
                  {
                    myzipfiles[index].async("string").then(function resolve(data)
                    {
                        var newslotname = "slot" + createRandomSuffix();
                        StorageFactory.getSetter(myzipfiles[index].name)(newslotname);
                        StorageFactory.getSetter(newslotname)(data);
                        index++;
                        storeZip(index++);
                    });
                  }
                  else
                  {
                    index++;
                    storeZip(index);
                  }
                }
              }                              

              
              console.log("zipfiles",myzipfiles);
              console.log("empty slot: ",StorageFactory.checkIfEmptyKey());
              var myjson = StorageFactory.getGetter('thejson')();
              myslots = StorageFactory.getGetter('myslots')();

              //creation of a flat json structure              
              for(i = 0 ; i< myzipfiles.length ; i++)
              {
                if(myzipfiles[i].dir)
                {
                    myjson.push({
                    id : Math.ceil(Math.random() * 10000),  
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name.substring(0,myzipfiles[i].name.length-1),
                    nodes : []
                    });
                }
                else
                {
                  var myobj = {
                    id : Math.ceil(Math.random() * 10000),
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name,
                    nodes : []
                    };
                  myjson.push(myobj);
                  myslots[myobj.id] = {title:myobj.title, isLocked:false};
                }
              }

              //sorting the array: highest amount of nodes first .
              myjson.sort(function compare(val1, val2)
              {
                if(val1.title.split('/').length > val2.title.split('/').length)
                {
                  return -1;
                }
                if(val1.title.split('/').length < val2.title.split('/').length)
                {
                  return 1;
                }
                return 0;
              });

                var helper1 = 0;//emergency variable to prevent a possible eternal loop
                var parentsfound = true; //escapes the while loop when we had a run with no results

                
                /*
                adding children to the parents node arrays; when there is a parent found myjson is changed
                and we will start the loop again
                */
                while(parentsfound &&  helper1 <100)
                {
                  parentsfound = false;
                  var copy = myjson;

                  for(var index = 0 ; index < myjson.length; index ++)
                  {
                    for(var j=0 ; j< copy.length; j++)
                    {
                      if(isParent(myjson[index].title, copy[j].title))
                      {
                        // console.log(myjson[index].title, "direct parent of " ,copy[j].title);
                        // console.log("myjson",myjson);
                        myjson[index].nodes.push(copy[j]);
                        myjson.splice(j,1);
                        parentsfound = true;
                        break;
                      }
                    }
                    if(parentsfound)
                    {
                      break;
                    }
                  }
                  helper1 ++;
                }
               


                /* Main helper function of the recursive loop; "dir1/dir2/file1.abc" compared with "dir1/dir2" will
                regard this as a direct parent-child relationship. */ 
                function isParent(possibleparent, candidate)
                {
                  if(possibleparent === candidate)
                  {
                    return false;
                  }
                  var index = candidate.lastIndexOf('/');
                  if(candidate.substring(0,index) === possibleparent)
                  {
                    return true;
                  }
                  else
                  {
                    return false;
                  }
                }

                console.log("generated json out of zip:\n",myjson, myslots);

                //saving json and working files structure to local storage, and returning to the caller
                StorageFactory.getSetter('thejson')(myjson);
                StorageFactory.getSetter('myslots')(myslots);  
                return(myjson); 

              });//end of jszip async call
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




        /*
          retrieves IAF configuration zip file via http, and transforms this zipfile  to a json object
          the zipfiles data are stored in LocalStorage;
        */
        function getZip()
        {
         
          var DOWNLOAD_URL = "/iaf/api/configurations/download/" + StaticDataFactory.getProjectName();
          var finalUrl = IAF_URL + DOWNLOAD_URL;
          PROJECTNAME = StaticDataFactory.getProjectName();

          if(null !== StaticDataFactory.getReqParams())
          {
            var params = StaticDataFactory.getReqParams();
            PROJECTNAME = params.instancename;
            DOWNLOAD_URL = "/iaf/api/configurations/download/" + params.instancename + '?version=' + params.version;
            finalUrl = IAF_URL + DOWNLOAD_URL ;
          }
          console.log("Download url :",finalUrl);
          
          

          return $http({method:"GET", url: finalUrl, responseType:'arraybuffer'}).then(function success(resp)
          {
            return new Promise(function (resolve, reject)
            {
            JSZip.loadAsync(resp.data).then(function(zip)
            {
              console.log("loadasync...", zip);
              StorageFactory.deleteAll();
              var myzipfiles = [];
              
              //removing the mac specific entries...don't know whether this is the proper way...
              zip.forEach(function(relativePath, file)
              {
                if(file.name.substring(0,2) !== '__' && file.name !== PROJECTNAME +'/' && file.name !== 'BuildInfo_SC.properties')
                {
                  myzipfiles.push(file);
                }
              });

              /*removing an unwanted wrapper directory (fe. 'Ibis4Student/Configuration.xml becomes 'Configuration.xml')
              when this wrapper directory has another name then the projectname we will leave it to warn the user to
              change the configuration name*/
              for(var i=0 ; i< myzipfiles.length; i++)
              {
                if(myzipfiles[i].name.indexOf(PROJECTNAME) > -1)
                      {
                        console.log("slicing out", myzipfiles[i].name);
                        var item = myzipfiles[i].name;
                        var helper = item.substring(item.lastIndexOf('/') + 1 ,item.length);
                        myzipfiles[i].name = helper;
                      }
              }


    
              /*Write to local storage; to avoid collisions, the calls
              are made synchronously.*/
              storeZip(0);
              
              function storeZip(index)
              {
                if(index > myzipfiles.length-1)
                {
                  return;
                }
                else
                {
                  if(!(myzipfiles[index].dir))
                  {
                    myzipfiles[index].async("string").then(function resolve(data)
                    {
                        var newslotname = "slot" + Math.ceil(Math.random()*1000);
                        StorageFactory.getSetter(myzipfiles[index].name)(newslotname);
                        StorageFactory.getSetter(newslotname)(data);
                        index++;
                        storeZip(index++);
                    });
                  }
                  else
                  {
                    index++;
                    storeZip(index);
                  }
                }
              }                              

              console.log("zipfiles",myzipfiles);
              var myjson=[];
              myslots = {};

              //creation of a flat json structure              
              for( i =0 ; i< myzipfiles.length ; i++)
              {
                if(myzipfiles[i].dir)
                {
                    myjson.push({
                    id : Math.ceil(Math.random() * 10000),  
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name.substring(0,myzipfiles[i].name.length-1),
                    nodes : []
                    });
                }
                else
                {
                  var myobj = {
                    id : Math.ceil(Math.random() * 10000),
                    isDirectory : myzipfiles[i].dir,
                    title : myzipfiles[i].name,
                    nodes : []
                    };
                  myjson.push(myobj);
                  myslots[myobj.id] = {title:myobj.title, isLocked:false};
                }
              }

              //sorting the array: highest amount of nodes first .
              myjson.sort(function compare(val1, val2)
              {
                if(val1.title.split('/').length > val2.title.split('/').length)
                {
                  return -1;
                }
                if(val1.title.split('/').length < val2.title.split('/').length)
                {
                  return 1;
                }
                return 0;
              });

                var helper3 = 0;//emergency variable to prevent a possible eternal loop
                var parentsfound = true; //escapes the while loop when we had a run with no results

                
                /*
                adding children to the parents node arrays; when there is a parent found myjson is changed
                and we will start the loop again
                */
                while(parentsfound &&  helper3 <100)
                {
                  parentsfound = false;
                  var copy = myjson;

                  for(var index = 0 ; index < myjson.length; index ++)
                  {
                    for(var j=0 ; j< copy.length; j++)
                    {
                      if(isParent(myjson[index].title, copy[j].title))
                      {
                        // console.log(myjson[index].title, "direct parent of " ,copy[j].title);
                        // console.log("myjson",myjson);
                        myjson[index].nodes.push(copy[j]);
                        myjson.splice(j,1);
                        parentsfound = true;
                        break;
                      }
                    }
                    if(parentsfound)
                    {
                      break;
                    }
                  }
                  helper3 ++;
                }
               


                /* Main helper function of the recursive loop; "dir1/dir2/file1.abc" compared with "dir1/dir2" will
                regard this as a direct parent-child relationship. */ 
                function isParent(possibleparent, candidate)
                {
                  if(possibleparent === candidate)
                  {
                    return false;
                  }
                  var index = candidate.lastIndexOf('/');
                  if(candidate.substring(0,index) === possibleparent)
                  {
                    return true;
                  }
                  else
                  {
                    return false;
                  }
                }

                console.log("generated json out of zip:\n",myjson);

                //saving json and working files structure to local storage, and returning to the caller
                StorageFactory.setCurrentKey(myslots[0]);
                StorageFactory.getSetter('thejson')(myjson);
                StorageFactory.getSetter('myslots')(myslots);  
                resolve(myjson); 

              }, 
              function failure(err)
              {
                console.log("error", err);
                reject(err);
              });//end of jszip async call

            });//end of Promise (necessary because of nested promises...)

        },
        function failure(err)
        {
          console.log("error in http call", err);
          return;
        },function failure(err)
        {
          console.log("error in http call", err);
          return;

        });//end of http);//end of http


      }//end of method getzip


     })//end of factory

  .factory('IafFactory', function($http, ZipService, UPLOAD_URL, $window,IAF_URL)
    {
      
    var uname = null;
    var pw = null;
    // var MYIAF_URL = $window.location.href;

    // if(MYIAF_URL.indexOf('/#/')> -1)
    //         {
    //           MYIAF_URL = MYIAF_URL.substring(0,MYIAF_URL.indexOf('/#/'));
    //         }

    //         if(MYIAF_URL.charAt(MYIAF_URL.length-1) === '/')
    //         {
    //           MYIAF_URL = MYIAF_URL.substring(0,MYIAF_URL.length-1);
    //         }

    //   console.log("IafFactory", MYIAF_URL);

      return{
        postConfig : postConfig
        
      };

      //resonding to the paperplane button upper right
      function postConfig(zip)
      {
        return new Promise(function(resolve, reject)
        {
          var finalurl = IAF_URL + UPLOAD_URL;
          PROJECTNAME = StaticDataFactory.getProjectName();
          alert(finalurl);
        zip.generateAsync({type:"blob"}).then(function(myzip)
        {
          var fileName = 'configuration.zip';
          var fd = new FormData();
          fd.append("realm", 'jdbc');
          fd.append("name", PROJECTNAME);
          fd.append("version", 1);
          fd.append("encoding", 'utf-8');
          fd.append("multiple_configs", false);
          fd.append("activate_config", true);
          fd.append("automatic_reload", true);
          fd.append("file", myzip, fileName);


          return new Promise(function(resolve, reject)
          {
             console.log("posting to iaf", myzip);
              return $http({method: 'POST',url:finalurl , data: fd , headers:{'Content-type': undefined}}
                  ).then(function succes(response)
                  {
                      console.info("returning from backend",response);
                      resolve (response);
                  }, function failure(response)
                  {
                      console.info("returning error from backend",response);
                      reject(response);
                  });
                });           
          });
        resolve();
        });
      }
      //responding to the submit button in the authentication area.
      //function setCredentials(server, uname, pw)
      //{
        // return new Promise(function(resolve, reject)
        // {
        //   if (server)
        //   {
        //     if(server.indexOf('/#/')> -1)
        //     {
        //       server = server.substring(0,server.indexOf('/#/'));
        //     }

        //     if(server.charAt(server.length-1) === '/')
        //     {
        //       server = server.substring(0,server.length-1);
        //     }


        //     console.log("credentials: " , server, uname, pw);
        //     MYIAF_URL = server;
        //     StorageFactory.getSetter('MYIAF_URL')(server);
        //     StaticDataFactory.setIafUrl();
        //     ZipService.setIafUrl();
        //     if(StaticDataFactory.getStaticJson() === null || StaticDataFactory.getStaticJson() === undefined)
        //     {
        //       StaticDataFactory.getJson().then(function success(resp)
        //       {
        //         console.log("succes from factory... now updating the scope");
        //         resolve(resp);
        //       },
        //       function failure(err)
        //       {
        //          console.log("failure getting json...", err);
        //          reject(err);
        //       });
        //     }
        //   }
        //   else
        //   {
        //     console.log("doing noting...");
        //   }
        // });
     // }
    });
}());