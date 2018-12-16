(function()
{
    'use strict';
    var app = angular.module('confab',['ui.select','ngSanitize','ngAnimate','ui.bootstrap','ui.tree', 'ui.router', 'ui.codemirror','ngCookies','angularLocalStorage']);
   
    app.config(function ($stateProvider, $urlRouterProvider, $httpProvider)
    {
        console.log('Application config...');
        //$httpProvider.interceptors.push('AuthInterceptor');
        $stateProvider

            // route for the home page
            .state('app', {
                url: '/',
                views: {
                    'content': {
                        templateUrl: 'views/home.html',
                        controller: 'IndexController as vm'
                    }
                }
            })
            .state('app.moderator', {
                url:'moderator',
                views: {
                    'content@': {
                        templateUrl : 'views/moderator.html',
                        controller  : 'ModeratorController as vm3'
                    }
                }
            })
            .state('app.userpage', {
                url:'userpage',
                views: {
                    'content@': {
                        templateUrl : 'views/userpage.html',
                        controller  : 'MyUserController as vm6'
                    }
                }
            })
            .state('app.landingpage', {
                url:'landingpage',
                views: {
                    'content@': {
                        templateUrl : 'views/landingpage.html',
                        controller  : 'LandingPageController as vm7'
                    }
                }
            });
        $urlRouterProvider.otherwise('/');
    });

})();