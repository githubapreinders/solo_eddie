(function()
{
'use strict';

var appliccat = angular.module('confab');
appliccat.factory('UserFactory', function UserFactory($http,  AuthTokenFactory, StorageFactory, $q, $window, IAF_URL)
    {
        var currentUser = null;
    	
        return {
            login: login,
            logout: logout,
            getUser: getUser,
            getAllUsers: getAllUsers,
            saveUser: saveUser,
            deleteUser: deleteUser,
            setCurrentUser: setCurrentUser,
            getCurrentUser: getCurrentUser,
            sendMail: sendMail,
            askSubscription : askSubscription,
            checkIfInstanceAvailable : checkIfInstanceAvailable
        };
     
        


        function checkIfInstanceAvailable()
        {
            var theurl = IAF_URL + '/api/subscribe'
            var theuser = 
            {
                "user":
                {
                    "firstname":"dummy",
                    "lastname":"dummy",
                    "role":"user",
                    "email":"dummymessage"
                }
            };
            console.log("url: ",theurl, JSON.stringify(theuser));
            return $http({method:"POST",url:theurl,data:JSON.stringify(theuser),headers:{'content-type':'application/json'}}).then(
                function success(response)
                {
                    return response;
                },function failure(err)
                {
                    return err;
                });   
        }

        
        function askSubscription(user)
        {


             var theurl = IAF_URL + '/api/subscribe'
                var theuser = 
                {
                    "user":
                    {
                        "firstname":user.firstname,
                        "lastname":user.lastname,
                        "role":"user",
                        "email":user.email
                    }
                };
                console.log("url: ",theurl, JSON.stringify(theuser));
                return $http({method:"POST",url:theurl,data:JSON.stringify(theuser),headers:{'content-type':'application/json'}}).then(
                function success(response)
                {
                    console.log("response", response);
                    return response;
                },function failure(response)
                {
                    console.log("response");
                    return response;
                });
            }



        //from usercontroller
        function sendMail(useremail)
        {
            var theurl = IAF_URL + '/api/newcredentials/' + useremail;
            console.log("sending to ",theurl);
            return $http.get(theurl).then(function success(response)
            {
                return response;
            },function failure(response)
            {
                return response;
            });
        }

        function getCurrentUser()
        {
            return currentUser;
        }

        function setCurrentUser(theuser)
        {
            currentUser = theuser;
            console.log("current user:", currentUser);
        }


        //saving or updating a user from userpage.html /usercontroller
        function saveUser(user)
        {
            console.log("instancename: ",user.instancename, typeof(user.instancename));
            if(undefined !== user.instancename.length && user.instancename.charAt(0)=='x')
            {
                console.log("deleting instance...");
                var theurl1 = IAF_URL + '/api/removeinstance/' + user.email;
                return $http.get(theurl1).then(
                    function success(res)
                    {
                        return res;
                    },
                    function fail(err)
                    {
                        return err;
                    });
            }
            else
            {
                var theurl = IAF_URL + '/api/users';
                var theuser = 
                {
                    "user":
                    {
                        "firstname":user.firstname,
                        "lastname":user.lastname,
                        "role":user.role,
                        "email":user.email
                    }
                };
                console.log("url: ",theurl, JSON.stringify(theuser));
                return $http({method:"POST",url:theurl,data:JSON.stringify(theuser),headers:{'content-type':'application/json'}}).then(
                function success(response)
                {
                    console.log("response", response);
                    return response;
                },function failure(response)
                {
                    console.log("response");
                    return response;
                });
            }
        }

        //from usercontroller
        function deleteUser(useremail)
        {
            var theurl = IAF_URL + '/api/deleteuser/' + useremail;
            console.log("sending to ",theurl);
            return $http.get(theurl).then(function success(response)
            {
                console.log("deleting user  ", response);
                return response;
            },function failure(response)
            {
                console.log("deleting user  ", response);
                return response;
            });
        }



        //from usercontroller
        function getAllUsers()
        {
            var theurl = IAF_URL + '/api/getusers';
            return $http.get(theurl).then(function success(response)
            {
                console.log("getting all users  ", response);
                return response.data.users.user;
            },function failure(response)
            {
                console.log("failure getting users  ", response);
                return response;
            });
        }

        //from mainpage, trying to login via the token
        function getUser()
        {
            if (AuthTokenFactory.getToken())
            {
                return $http.get(IAF_URL + '/api/me');
            }
            else
            {
                return $q.reject({data: 'client has no auth token'});
            }
        }

        function login(useremail, password)
        {
           var theurl = IAF_URL + '/api/login';
        	console.log("url: ",theurl);
            if(AuthTokenFactory.getToken())//remove old tokens , logging in without tokens
            {
                console.log("removing an existing token...");
                AuthTokenFactory.setToken();
            }
            return $http.post(theurl,
                {"logindetails":{
                    "email": useremail,
                    "password": password}
                }).then(function success(response)
            {
                AuthTokenFactory.setToken(response.data.logindetails.accesstoken);
                return response;
            },function failure(error)
            {
                console.log("statuscode ", error.data.loginDetails.result);
                return error;
            });

               
        }
        function logout()
        {
            return $http.get(IAF_URL + '/api/logout').then(
        	function succes(response)
            {
                console.info("token removed from backend",response);
                AuthTokenFactory.setToken();
                return response;
            }, function failure(response)
            {
                console.info("returning error from backend",response);
                return response;
            });

        }

    });


    appliccat.factory('AuthTokenFactory', function AuthTokenFactory($window)
    {

        var store = $window.localStorage;
        var key = 'auth-token';

        return {
            getToken: getToken,
            setToken: setToken
        };

        function getToken()
        {
            return store.getItem(key);
        }

        function setToken(token)
        {
            if (token)
            {
                store.setItem(key, token);
            }
            else
            {
                store.removeItem(key);
            }
        }
    });


    appliccat.factory('AuthInterceptor', function AuthInterceptor(AuthTokenFactory)
    {

        return {
            request: addToken
        };

        function addToken(config)
        {
            var token = AuthTokenFactory.getToken();
            if (token)
            {
                config.headers = config.headers || {};
                config.headers.Authorization = token;
            }
            return config;
        }
    });

    




}());