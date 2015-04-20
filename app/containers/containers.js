'use strict';

angular.module('containers', ['ngRoute'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/containers', {
            templateUrl: 'app/containers/containers.html',
            controller: 'ContainerCtrl'
        });
    }])
    .controller('ContainerCtrl', ['$rootScope', '$scope', '$location', 'Helpers', 'Docker', function ($rootScope, $scope, $location, Helpers, Docker) {
        if (Helpers.isEmpty($rootScope.hostUrl)) {
            $location.path('/hosts');
        } else {
            $scope.showAllContainersFlag = false;
            $scope.showContainerSizeFlag = false;
            $scope.selectAllFlag = false;


            refreshContainers();

            $scope.refreshContainers = function () {
                $scope.containerListing = true;
                $scope.containerListingMessage = 'Loading container list';
                refreshContainers();
            };
            //
            $scope.switchSelected = function (containerData) {
                containerData.selected = !containerData.selected;
            };
            $scope.switchSelectAllFlag = function () {
                $scope.selectAllFlag = !$scope.selectAllFlag;
            };
            //
            $scope.switchShowAllContainersFlag = function () {
                $scope.showAllContainersFlag = !$scope.showAllContainersFlag;
                refreshContainers();
            };
            $scope.switchShowContainerSizeFlag = function () {
                $scope.showContainerSizeFlag = !$scope.showContainerSizeFlag;
                refreshContainers();
            };
            //
            $scope.goContainerDetails = function (path) {
                $location.path('/containerDetails/' + path);
            };
            //
            $scope.goImageDetails = function (path) {
                $location.path('/imageDetails/' + path);
            };
            //
            $scope.startContainer = function (containerId) {
                Docker.containers().start({containerId: containerId}, {}, function () {
                        refreshContainers();
                    }
                );
            };
            //
            $scope.pauseContainer = function (containerId) {
                Docker.containers().pause({containerId: containerId}, {}, function () {
                        refreshContainers();
                    }
                );
            };
            //
            $scope.unpauseContainer = function (containerId) {
                Docker.containers().unpause({containerId: containerId}, {}, function () {
                        refreshContainers();
                    }
                );
            };
            //
            $scope.stopContainer = function (containerId) {
                Docker.containers().stop({containerId: containerId}, {}, function () {
                        refreshContainers();
                    }
                );
            };
            //
            $scope.removeContainer = function (containerId) {
                Docker.containers().remove({containerId: containerId, v: 1, force: 1}, {}, function () {
                        refreshContainers();
                    }
                );
            };
        }

        function getObjectPropertiesAmount(containerDataList) {
            var count = 0;
            for (var prop in containerDataList) {
                if (containerDataList.hasOwnProperty(prop)) {
                    ++count;
                }
            }
            return count;
        }

        function refreshContainers() {
            var containerDataList = {};
            var containerParam = {};
            if ($scope.showAllContainersFlag == true) {
                containerParam.all = 1;
            }
            var containers = Docker.containers().query(containerParam, function () {
                $scope.containerListing = false;
                containers.forEach(function (container) {
                    var containerData = {};
                    containerData.container = container;

                    var containerStatus = '';
                    if (container.Status.indexOf('Up') == 0 || container.Status.indexOf('Restarting') == 0 || container.Status.indexOf('Removal') == 0) {
                        if (container.Status.indexOf('Paused') > -1 || container.Status.indexOf('Removal') == 0) {
                            containerStatus = 'paused';
                        } else {
                            containerStatus = 'running';
                        }
                    } else {
                        if (container.Status == '') {
                            containerStatus = 'created';
                        } else {
                            containerStatus = 'stopped';
                        }

                    }
                    containerData.containerStatus = containerStatus;


                    containerData.Selected = false;
                    containerDataList[container.Id] = containerData;
                    var containerDetails = Docker.containers().get({containerId: container.Id}, function () {
                        $scope.containerDetails = containerDetails;
                        containerData.containerDetails = containerDetails;
                    });

                });
                $scope.containerDataList = containerDataList;
                $scope.containerDataListSize = getObjectPropertiesAmount(containerDataList);
            });
            if ($scope.showContainerSizeFlag == true) {
                containerParam = {};
                if ($scope.showAllContainersFlag == true) {
                    containerParam.all = 1;
                }
                if ($scope.showContainerSizeFlag == true) {
                    containerParam.size = 1;
                }
                $scope.containerSizeListing = true;
                $scope.containerSizeListingMessage = 'Querying container size data. It could take some time.';
                var containersWithSize = Docker.containers().query(containerParam, function () {
                    containersWithSize.forEach(function (containerWithSize) {
                        var containerData = containerDataList[containerWithSize.Id];
                        if (containerWithSize.Id == containerData.container.Id) {
                            containerData.container = containerWithSize;
                        }
                    });
                    $scope.containerSizeListing = false;
                    $scope.containerDataList = containerDataList;
                    $scope.containerDataListSize = getObjectPropertiesAmount(containerDataList);
                });
            }
        }
    }])
;