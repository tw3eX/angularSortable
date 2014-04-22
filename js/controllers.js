'use strict';
/* Controllers */
/* No multiple instances;text && type is reserved fields;text is required;add some data to items (bars);fix problem with cursor pos and length-2 element;html must be clean =( */

var sortableApp = angular.module('testApp', []);
sortableApp.directive('isdraggable', function () {
    return function (scope, element, attrs) {
        var el = element[0];
        el.draggable = true;        

        el.addEventListener(
            'dragstart',
            function (e) {
                if (attrs.index == 0 || attrs.index == scope.items.length - 1) {
                    e.preventDefault();
                    return false;
                }            
                
                scope.$apply(function(){                   
                    scope.renderEffects(element.parent());
                });
   
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.dropEffect = 'move'
                
                e.dataTransfer.setData('dragIndex', attrs.index);
                e.dataTransfer.setData('dragHtml', attrs.$$element[0].innerHTML);

                scope.items[attrs.index].type = 'dragEl';
                scope.$apply('pushWay(' + attrs.index + ')');
                return false;
            },
            false
        );
        el.addEventListener(
            'dragenter',
            function (e) {

                if (scope.items[attrs.index].type || scope.items[attrs.index].type == 'placeholderEl') {
                    e.preventDefault();
                    return false;
                }
                e.dataTransfer.dropEffect = 'move';           

                var wayNew = parseInt(scope.way[0]);
                var wayOld = parseInt(scope.way[1]);
                var curHover = parseInt(attrs.index);
                var curPlaceholder = parseInt(scope.placeholder);
                var lastElement = scope.items.length - 1;
                var dragEl = e.dataTransfer.getData('dragIndex');
                var dragHtml = e.dataTransfer.getData('dragHtml');

                if (curHover === 0) {
                    scope.$apply('pushWay(1)')
                    scope.$apply('pushWay(0)')
                } else if (curHover === lastElement) {
                    scope.$apply('pushWay(' + (lastElement - 1) + ')')
                    scope.$apply('pushWay(' + (lastElement) + ')')
                } else {
                    if (wayOld != curHover) scope.$apply('pushWay(' + curHover + ')')
                }

                wayNew = parseInt(scope.way[0]);
                wayOld = parseInt(scope.way[1]);

                if (wayNew > wayOld) {
                    var ghostPos = wayOld;
                } else {
                    var ghostPos = wayNew;
                }

                ghostPos++;

                if (ghostPos == 0) {
                    ghostPos++;
                }
                if (ghostPos == lastElement) {
                    ghostPos--;
                }

                if (attrs.index != scope.placeholder) scope.$apply('removePlaceholder()');
                if (Math.abs(dragEl - curHover) > 1) {
                    scope.$apply('insertPlaceholder(' + ghostPos + ', 0, {"text":"' + dragHtml + '","type":"placeholderEl"})');
                }
                //TODO: fix problem with display:block and dragenter, when curHover != lastElement && dragEl != lastElement + 1
                if (curHover != lastElement && dragEl != lastElement + 1) {
                    scope.$apply(function(){                   
                    scope.renderEffects(element.parent());
                });
                }
                return false;
            },
            false
        );
        el.addEventListener(
            'dragleave',
            function (e) {
                e.dataTransfer.dropEffect = 'move';          
                scope.$apply(function(){                   
                    scope.renderEffects(element.parent());
                });            
                return false;
            },
            false
        );
        el.addEventListener(
            'dragend',
            function (e) {
                scope.$apply('endDrag(1)');               
                scope.way[0] = -1;
                scope.way[1] = -1;
                scope.$apply('dragEnd()');
                scope.$apply(function(){                   
                    scope.renderEffects(element.parent());
                }); 
            },
            false
        );
    }
});
sortableApp.controller('DndItemsListCtrl', function ($scope) {
    //TODO: get from other source
    $scope.items = [{
        'text': '1',
        'info' : 'some'
    }, {
        'text': '2'
    }, {
        'text': '3'
    }, {
        'text': '4'
    }];
    $scope.rootUl;
    $scope.way = [-1, -1];
    $scope.placeholder = -1;

    //remove bars and set text,type fields not required
    $scope.items.unshift("{'type':'top_bar'}");
    $scope.items.push("{type':'bottom_bar'}");

    $scope.pushWay = function (index) {
        $scope.way.shift(index);
        $scope.way.push(index);
    }

    $scope.insertPlaceholder = function (index, b, c) {
        if ($scope.placeholder == -1) {
            $scope.removePlaceholder();
            $scope.items.splice(index, b, c);
        }
        $scope.placeholder = index;
    }

    $scope.removePlaceholder = function () {
        if ($scope.placeholder !== -1) {
            for (var index = 0; index < $scope.items.length; ++index) {
                if (!$scope.items[index].type) continue;
                if ($scope.items[index].type === "placeholderEl") {
                    $scope.items.splice(index, 1);
                    break;
                }
            }
            $scope.placeholder = -1;
        }
    }

    $scope.dragEnd = function (index) {
     
        for (var i = 0; i < $scope.items.length; i++) {
            if (!$scope.items[i].type) continue;
            if ($scope.items[i].type == 'placeholderEl') {
                var placeholderEl = i;
            }
            if ($scope.items[i].type == 'dragEl') {
                var dragEl = i;
            }
        }
        delete $scope.items[dragEl].type;
        if (dragEl && placeholderEl) {
            $scope.items[dragEl] = $scope.items.splice(placeholderEl, 1, $scope.items[dragEl])[0];
            $scope.items.splice(dragEl, 1);
        }
       
    }

    //TODO: add some effects for over,drag && others
    $scope.renderEffects = function (rootUl) {           
        var list = rootUl[0].children;
        for (var i = 0; i < list.length; i++) {
            list[i].classList.remove('dragEl');
            list[i].classList.remove('placeholderEl');
        }      
        for (var i = 0; i < $scope.items.length; i++) {
            //console.log(rootUl[0].children)
            if (!$scope.items[i].type) continue;
            if ($scope.items[i].type == 'placeholderEl') {

                rootUl[0].children[i].classList.add('placeholderEl');
            } else {
                rootUl[0].children[i].classList.remove('placeholderEl');
            }
            if ($scope.items[i].type == 'dragEl' && $scope.placeholder != -1) {
                rootUl[0].children[i].classList.add('dragEl');
            } else if ($scope.items[i].type == 'dragEl' && $scope.placeholder == -1) {
                rootUl[0].children[i].classList.remove('dragEl');
            }
        }
    }
});