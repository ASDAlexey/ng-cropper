'use strict';
var app = angular.module('demo', ['ngCropper']);
app.controller('UploadController', function ($scope, $timeout, Cropper, $rootScope, Modal) {
    $scope.Modal = Modal;
    var file, data;

    /**
     * Method is called every time file input's value changes.
     * Because of Angular has not ng-change for file inputs a hack is needed -
     * call `angular.element(this).scope().onFile(this.files[0])`
     * when input's event is fired.
     */
    $scope.onFile = function (blob) {
        if (blob.type == 'image/jpeg' || blob.type == 'image/png') {
            Cropper.encode((file = blob)).then(function (dataUrl) {
                $scope.dataUrl = dataUrl;
                $timeout(showCropper);  // wait for $digest to set image's src
            });
        } else {
            alert('Please provide correct file');
        }
    };
    $scope.$on('show', function (event, responce) {
        $timeout(function () {
            Modal.isOpen = true;
        }, 0);
    });

    /**
     * Croppers container object should be created in controller's scope
     * for updates by directive via prototypal inheritance.
     * Pass a full proxy name to the `ng-cropper-proxy` directive attribute to
     * enable proxing.
     */
    $scope.cropper = {};
    // $scope.cropperProxy = 'cropper.first';

    /**
     * When there is a cropped image to show encode it to base64 string and
     * use as a source for an image element.
     */
    $scope.preview = function () {
        if (!file || !data) return;
        Cropper.crop(file, data).then(Cropper.encode).then(function (dataUrl) {
            ($scope.preview || ($scope.preview = {})).dataUrl = dataUrl;
        });
    };

    /**
     * Use cropper function proxy to call methods of the plugin.
     * See https://github.com/fengyuanchen/cropper#methods
     */
    $scope.clear = function (degrees) {
        if (!$scope.cropper.first) return;
        $scope.cropper.first('clear');
    };

    $scope.scale = function (width) {
        Cropper.crop(file, data)
            .then(function (blob) {
                return Cropper.scale(blob, {width: width});
            })
            .then(Cropper.encode).then(function (dataUrl) {
            ($scope.preview || ($scope.preview = {})).dataUrl = dataUrl;
        });
    };

    /**
     * Object is used to pass options to initalize a cropper.
     * More on options - https://github.com/fengyuanchen/cropper#options
     */
    $scope.options = {
        maximize: true,
        aspectRatio: NaN,
        responsive: true,
        autoCrop: false,
        crop: function (dataNew) {
            data = dataNew;
        }
    };

    /**
     * Showing (initializing) and hiding (destroying) of a cropper are started by
     * events. The scope of the `ng-cropper` directive is derived from the scope of
     * the controller. When initializing the `ng-cropper` directive adds two handlers
     * listening to events passed by `ng-cropper-show` & `ng-cropper-hide` attributes.
     * To show or hide a cropper `$broadcast` a proper event.
     */
    $scope.showEvent = 'show';
    $scope.hideEvent = 'hide';

    function showCropper() {
        $scope.$broadcast($scope.showEvent);
    }

    function hideCropper() {
        $scope.$broadcast($scope.hideEvent);
    }

    $scope.pictures = [];
    $scope.oData = {
        id: 1
    };
    //modal
    Modal.isOpen = false;
    $scope.cropImage = function () {
        if (!file || !data) return;
        Cropper.crop(file, data).then(Cropper.encode).then(function (dataUrl) {
            ($scope.preview || ($scope.preview = {})).dataUrl = dataUrl;
            var oNewImageObj = {
                id: null,
                "src": $scope.preview.dataUrl,
                "itemId": $scope.oData.id,
                "mainImage": false,
                "toSave": true
            };
            $scope.pictures.push(oNewImageObj);
            Modal.isOpen = false;
            $timeout(function () {
                hideCropper();
            }, 800);
            $rootScope.$broadcast('clear-file');
        });
    };
    $scope.closeModal = function () {
        $rootScope.$broadcast('clear-file');
        Modal.isOpen = false;
        $timeout(function () {
            hideCropper();
        }, 800);
    };
    $scope.$on('closeModal', function (event, responce) {
        $scope.closeModal();
    });
    //delete image
    $scope.delete = function (image) {
        $scope.pictures = _.without($scope.pictures, image);
    }
});
app.directive('file', function () {
    return {
        restrict: 'A',
        scope: {},
        link: function (scope, element, attrs) {
            scope.$on('clear-file', function (event, responce) {
                element.val(null);
            });
        }
    }
});
app.directive('modal', function (Modal, $document,$rootScope) {
    return {
        restrict: 'A',
        scope: {
            modal: "="
        },
        link: function (scope, element, attrs) {
            //close on press Esc
            var closeEsc = function (e) {
                if (e.keyCode === 27 && Modal.isOpen) {
                    $rootScope.$broadcast('closeModal');
                    scope.$apply();
                }
            };
            scope.$watch('modal', function (newVal, oldVal) {
                if (!angular.equals(oldVal, newVal)) {
                    if (newVal) {
                        $document.on("keyup", closeEsc);
                    } else {
                        $document.off("keyup", closeEsc);
                    }
                }
            }, true);
        }
    }
});
app.service('Modal', [function () {
    this.isOpen = false;
}]);
