!function ($) {
    $.builder = function (options) {

        var currentUrl = '';

        var settings = {
            baseurl: '',
            supporturl:'',
            use_query_string: true,
            countdown: 60,
            title: 'Your session is about to expire!',
            message: 'You will be logged out in {0} seconds.',
            question: 'Do you want to stay signed in?',
            keep_alive_button_text: 'Renew Session',
            sign_out_button_text: 'Sign out',
            keep_alive_url: '/keep-alive',
            logout_url: null,
            logout_redirect_url: '/',
            restart_on_yes: true,
            dialog_width: 350
        }

        $.extend(settings, options);

        var QueryString = function () {
            var getChildren = function () {
                var queryVar = window.location.search.substring(1).split('&');
                var children = [];
                $.each(queryVar, function (key, value) {
                    if (value.split('=')[0].substring(0, 5) == 'child') {
                        children.push(value.split('=')[0]);
                    }
                });

                return children;
            };

            this.Children = getChildren();

        }

        QueryString.prototype.hasQuery = function (query) {
            if (query == "") return false;

            if (this.get[query] != undefined)
                return true;
            return false;
        };

        QueryString.prototype.get = (function (a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i) {
                var p = a[i].split('=');
                if (p.length != 2) continue;
                b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'));

        function getFeatures(objref, feature) {
            var spinner;
            var url = settings.baseurl + '?func=wb.getfeatures&objref=' + objref;
            $.ajax({
                url: url,
                dataType :'json',
                beforeSend: function () {
                    var target = document.getElementById('rightsidebar');
                    spinner = new Spinner(spinOpt).spin(target);
                }
            }).done(function (data) {
                var items = [];
                $('#features').empty();
                $.each(data, function (key, value) {
                    $('#features').append('<li><a class="feature" style="background-image:url(' + value.icon + ');" data-parentname = "' + value.parentName + '" data-parent = ' + value.parent + ' data-name = "' + value.name + '" data-inheritance = ' + value.inheritance + ' data-type=' + value.featureType + ' id=' + value.id + '>' + value.name + '</a></li>');
                });
                $('#features').trigger('changed', feature);                
            }).complete(function () {
                spinner.stop();
            })
        }

        function getFeatureValue(feature) {
            var spinner;
            var url = settings.baseurl + '?func=wb.getfeaturevalue&parent=' + feature.data().parent + '&name=' + feature.data().name;
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    var target = document.getElementById('editor');
                    spinner = new Spinner(spinOpt).spin(target);
                }
            }).done(function (data) {
                addTab(feature, data);
            }).complete(function () {
                spinner.stop();
            });
        }

        function createEditor(id) {
            var editor = ace.edit(id);
            editor.setTheme("ace/theme/textmate");
            editor.getSession().setMode("ace/mode/oscript");
            Builder.editors.push({ id: id, editor: editor });
            return editor;
        }

        function activateTab(tabId) {
            console.log('Activating tab ' + tabId)
            var element = $('#builder-tabs');            

            var tabs = $(element.children(".tabs")).children("li");
            tabs.removeClass('active');

            var frames = $(element.children(".frames")).children(".frame");
            frames.hide();
            tabs.has('a[href="' + tabId + '"]').addClass('active');
            $(tabId).show();

            element.tabcontrol();

            var feature = $('.feature.active');
                        

            if (isLocked(feature.data().parent)) {
                $.each(Builder.editors, function (i,e) {
                    if(e.id == tabId)
                    {
                        e.editor.setReadOnly(true);
                    }
                })                
                $('#savecommand').hide();
                $('#editcommand').show();
            }
            else {
                $('#editcommand').hide();
                $('#savecommand').show();                                
            }

            if (feature.data().type == -3)
                $('#executecommand').show();
            else
                $('#executecommand').hide();
        }

        function isLocked(object)
        {
            var node = $('#modules').jstree(true).get_node(object)            
            var ospace = node.parents[node.parents.length - 3];
            var ospacenode = $('#modules').jstree(true).get_node(ospace);
            console.log(ospacenode);
            if(ospacenode.original.type == 'ospace')
            {                
                //return ospacenode.original.isLocked;
            }
            return false;
        }

        function addTab(feature, data) {
            console.log('Adding new tab.')
            var tabId = 'tab_' + feature.data().parent + '_' + feature.attr('id');

            var featuredata = feature.data();

            var parentName = feature.data().parentname === '' ? '#' + feature.data().parent : feature.data().parentname

            var element = $('#builder-tabs');
            var frames = $(element.children(".frames")).children(".frame");


            if (frames.is('#' + tabId)) {
                activateTab('#' + tabId);
                return;
            };

            var tabs = $(element.children(".tabs"));
            tabs.children("li").removeClass('active');
            frames.hide();

            var $li = $("<li>", { class: 'active' });
            var $link = $("<a></a>").attr({ href: '#' + tabId }).append('<span class="feature-parent">' + parentName + '<span class="icon-cancel"></span></span><span>' + feature.text() + '</span>');
            $link.data(featuredata)
            $li.append($link).prependTo(tabs);
            var $frame = $("<div>").addClass('frame').attr({ id: tabId }).css({ 'display': 'block' }).appendTo('#builder-tabs .frames');
            element.tabcontrol({ effect: 'slide' });


            switch (data.type) {
                case 5: //boolean                        
                    $frame.append(createBooleanBox(data.value));
                    break;
                default:
                    var editor = createEditor(tabId);
                    if (data.value === null) {
                        editor.setValue("");
                    }
                    else {
                        editor.setValue(data.value, 1);
                        if (isLocked(feature.data().parent)) {
                            editor.setReadOnly(true);
                            $('#savecommand').hide();
                            $('#editcommand').show();
                        }
                        else {
                            $('#editcommand').hide();
                            $('#savecommand').show();
                            console.log(data.type)
                            if (data.type == -3)
                                $('#executecommand').show();
                            else
                                $('#executecommand').hide();
                        }
                    }
                    break;
            }
        }

        function createBooleanBox(value) {
            var strTrueChk, strFalseChk;
            if (value)
                strTrueChk = 'checked'
            else
                strFalseChk = 'checked'

            var rootDiv = $('<div>').attr({ 'id': 'booleanBox' });
            var innerDiv = $('<div>').addClass("input-control radio default-style");
            var ctrlTrue = $('<label><input name="boolean" ' + strTrueChk + '  type="radio" /><span class="check"></span>True</label>');
            var ctrlFalse = $('<label><input name="boolean" ' + strFalseChk + ' type="radio" /><span class="check"></span>False</label>');
            innerDiv.append(ctrlTrue).append(ctrlFalse).appendTo(rootDiv);
            return rootDiv;
        }

        $('#builder-tabs ul').on('click', 'a', function (e) {
            var node = $('#modules').jstree(true).get_node($(this).data('parent'));
            scrollToNode(node);
            $.jstree.reference('#modules').deselect_all(true);
            node.SelectFeature = $(this).data().name.replace(' ', '_');
            $.jstree.reference('#modules').select_node(node);
            activateTab($(this).attr('href'));
        });

        $('#builder-tabs ul').on("click", "a span span.icon-cancel", function (e) {

            e.stopPropagation();
            e.preventDefault();

            var $link = $(this).closest('a');
            var tabId = $link.attr('href')
            var $li = $link.parent();

            if ($li.siblings().length != 0) {
                if ($li.prev().length != 0)
                    activateTab($li.prev().children().attr('href'));
                else
                    activateTab($li.next().children().attr('href'));
            }

            $link.parent().remove();
            $($link.attr('href')).remove();

            //Removing editor from editors
            $.each(builder.editors, function (i, val) {
                if (val.id == tabId.substring(1, tabId.length)) {
                    builder.editors.splice(i, 1);
                }
            });
        });

        function scrollToNode(node) {
            if (node === undefined)
                return;
            var id;
            var siblingCount = $('#' + node.id).parent().children('li').length;
            if (siblingCount > 40) {
                id = $('#' + node.id).prevAll().eq(10).attr('id');
            }
            else if (siblingCount > 15)
                id = node.parent == '#' ? node.id : node.parent;
            else
                id = node.parents[node.parents.length - 2];
            var container = $('#modules');
            var scrollTo = $('#' + id);
            if (scrollTo.length > 0)
                container.animate({
                    scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
                });
        }

        function scrollToFeature(feature) {
            var element = $('#' + feature);
            var scrollTo = element.parent().prevAll().eq(5);
            var container = $('#featuresbox');

            if (scrollTo.length > 0) {
                container.animate({
                    scrollTop: scrollTo.offset().top - container.offset().top + container.scrollTop()
                });
            }
        }

        function activateFeature(feature) {
            $('#features li a').removeClass('active');
            feature.addClass('active');
            setCurrentUrl();
        }

        $('#features').on('click', 'a.feature', function () {
            activateFeature($(this));
            getFeatureValue($(this));
        });

        $('#features').on('changed', function (e, data) {
            if (data != undefined)
                activateFeature($('#' + data));
            Builder.filterFeatures();
        });

        $("#modules").on("select_node.jstree", function (evt, data) {
            if (data.node.original.type == 'object') {
                getFeatures(data.node.original.objref, data.node.SelectFeature);
                setCurrentUrl(data.node);

            }
        });

        $("#modules").on("changed.jstree", function (evt, data) {            
            setCurrentUrl(data.node);
        });

        function setCurrentUrl(node) {

            var query = {
                'func': 'admin.webbuilder'
            };

            //Get Selected Feature
            var $feature = $('#features').find('li .active');
            var feature = $feature.attr('data-name');


            if (node == undefined) {
                var parent = $feature.attr('data-parent');
                if (parent == undefined)
                    return;
                node = $('#modules').jstree(true).get_node(parent);
            }

            var path = $('#modules').jstree(true).get_path(node, false, true);

            switch (path.length) {
                case 0:
                    break;
                case 1:
                    query.module = path[0];
                    break;
                case 2:
                    query.module = path[0];
                    query.ospace = path[1];
                    break;
                case 3:
                    query.module = path[0];
                    query.ospace = path[1];
                    query.orphan = path[2];
                    break;
                case 4:
                    query.module = path[0];
                    query.ospace = path[1];
                    query.orphan = path[2];
                    query.child_1 = path[3];
                    break;
                default:
                    query.module = path[0];
                    query.ospace = path[1];
                    query.orphan = path[2];
                    for (i = 3; i < path.length; i++) {
                        var temp = 'child_' + parseInt(i - 2);
                        query[temp] = path[i];
                    }
                    break;
            }

            if (feature != undefined) {
                query.feature = feature;
            }

            query = $.param(query);

            query = location.protocol + "//" + location.host + settings.baseurl + '?' + query;
            Builder.currentUrl = query;
            console.log(query);
            return query;
        }

        function exportOSpace($node) {
            var url = settings.baseurl + '?func=wb.cmd.ospace.exportospace&ospace=' + $node.text;
            var lSpinner;
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    var target = document.getElementById('leftsidebar');
                    console.log(target);
                    lSpinner = new Spinner(spinOpt).spin(target);
                }
            }).done(function (data) {
                if (data != undefined) {
                    if (data.ok) {
                        $.Notify({
                            caption: "Success",
                            content: 'OSpace exported succesfully.',
                            style: { 'background': 'green', 'color': '#fff' }
                        });                        
                    }
                    else {
                        $.Notify({
                            caption: "Error",
                            content: data.errMsg,
                            style: { 'background': 'red', 'color': '#fff' }
                        });
                    }
                }
            }).complete(function () {
                console.log('completed');
                lSpinner.stop();
            })
            return $node;
        }

        function lockOSpace($node)
        {
            var url = settings.baseurl + '?func=wb.cmd.ospace.lock&ospace=' + $node.text;            
            var lSpinner;            
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    var target = document.getElementById('leftsidebar');
                    console.log(target);
                    lSpinner = new Spinner(spinOpt).spin(target);                    
                }
            }).done(function (data) {
                if (data != undefined) {
                    if (data.ok) {                        
                        $.Notify({
                            caption: "Success",
                            content: 'OSpace locked Succesfully.',
                            style: { 'background': 'green', 'color': '#fff' }
                        });
                        $node.original.isLocked = true;
                        $node.icon = settings.supporturl + 'images/tree_locked16_b24.png';
                        $('#' + $node.id + ' a i').eq(0).css('background-image', 'url(' + $node.icon + ')')
                    }
                    else {
                        $.Notify({
                            caption: "Error",
                            content: data.errMsg,
                            style: { 'background': 'red', 'color': '#fff' }
                        });
                    }
                }
            }).complete(function () {
                console.log('completed');
                lSpinner.stop();
            })
            return $node;
        }

        function unlockOSpace($node) {
            var url = settings.baseurl + '?func=wb.cmd.ospace.unlock&ospace=' + $node.text;
            var uSpinner;            
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    var target = document.getElementById('leftsidebar');
                    uSpinner = new Spinner(spinOpt).spin(target);
                }
            }).done(function (data) {
                if (data != undefined) {
                    if (data.ok) {
                        $.Notify({
                            caption: "Success",
                            content: 'OSpace Unlocked Succesfully.',
                            style: { 'background': 'green', 'color': '#fff' }
                        });
                        $node.original.isLocked = false;
                        $node.icon = settings.supporturl + 'images/tree16_b24.png';
                        $('#' + $node.id + ' a i').eq(0).css('background-image', 'url(' + $node.icon + ')')
                    }
                    else {
                        $.Notify({
                            caption: "Error",
                            content: data.errMsg,
                            style: { 'background': 'red', 'color': '#fff' }
                        });
                    }
                }
            }).complete(function () {
                uSpinner.stop();
            })
            return $node;
        }

        function showOSpaceProperties($node)
        {
            var url = settings.baseurl + '?func=wb.cmd.ospace.Properties&ospace=' + $node.text;
            var uSpinner;
            $.ajax({
                url: url,
                dataType: 'json',
                beforeSend: function () {
                    var target = document.getElementById('leftsidebar');
                    uSpinner = new Spinner(spinOpt).spin(target);
                }
            }).done(function (data) {
                if (data != undefined) {
                    if (data.ok) {
                        console.log(data);
                        $.Dialog({
                            shadow: true,
                            overlay: true,
                            icon: '<img src="' + $node.original.icon + '"/>',
                            title: $node.original.ospace + ' Properties',
                            width: 500,
                            height: 200,
                            padding: 10,
                            content: '<table><tr><th style="text-align:left;padding-right:10px;">OSpace</th><td>' + $node.original.ospace + '</td></tr><tr><th style="text-align:left;padding-right:10px;">Location</th><td>' + data.Location + '</td></tr><tr><th style="text-align:left;padding-right:10px;">Size</th><td>' + data.Size + '</td></tr><tr><th style="text-align:left;padding-right:10px;">Dependencies</th><td>' + data.Dependencies + '</td></tr></table>'
                        });
                    }
                    else {
                        $.Notify({
                            caption: "Error",
                            content: data.errMsg,
                            style: { 'background': 'red', 'color': '#fff' }
                        });
                    }
                }
            }).complete(function () {
                uSpinner.stop();
            })            
        }

        var Builder = {

            init: function () {

                this.loadModules();

                var queryString = new QueryString();

                var afterOpenHandler = function (e, data) {

                    scrollToNode(data.node);

                    //Open ospace from url
                    if (data.node.original.type === 'module') {
                        if (queryString.hasQuery('ospace')) {
                            console.log('Opening ospace specified in url.');
                            $.jstree.reference('#modules').open_node(queryString.get.ospace);
                        }
                    }

                    if (data.node.original.type === 'ospace') {
                        if (queryString.hasQuery('orphan')) {
                            if (queryString.Children.length === 0) {
                                console.log('Selected orphan specified in url.')
                                $.jstree.reference('#modules').select_node(queryString.get.orphan, true);

                                console.log('Unbinding intializing event handler for jstree.');
                                $('#modules').unbind('after_open.jstree', afterOpenHandler);

                                return;
                            }

                            console.log('Opening orphan specified in url.');
                            $.jstree.reference('#modules').open_node(queryString.get.orphan);
                        }
                    }

                    if (data.node.original.type === 'object') {
                        var child = queryString.get[queryString.Children.shift()];
                        if (queryString.Children.length == 0) {
                            if (child != undefined) {
                                console.log('Selecting children specified in url.')
                                $.jstree.reference('#modules').select_node(child);

                                console.log('Unbinding intializing event handler for jstree.');
                                $('#modules').unbind('after_open.jstree', afterOpenHandler);
                            }
                        }
                        else {
                            console.log('Opening children specified in url.')
                            $.jstree.reference('#modules').open_node(child);

                            return;
                        }
                    }

                }

                //Open module specified in url
                $('#modules').one('loaded.jstree', function () {
                    if (queryString.hasQuery('module')) {
                        console.log('Opening module specified in url');
                        $.jstree.reference('#modules').open_node(queryString.get.module);
                    }

                    $('#modules').bind('after_open.jstree', afterOpenHandler);

                });

                $('#modules').one('changed.jstree', function (e, data) {
                    scrollToNode(data.node);
                });

                $('#features').one('changed', function (e, data) {
                    if (queryString.hasQuery('feature')) {
                        var feature = $('#features li a[data-name="' + queryString.get.feature + '"]');
                        feature.trigger('click');
                        scrollToFeature(feature.attr('id'));
                    }
                });

            },

            loadModules: function () {
                console.log('Loading modules.');
                $('#modules').jstree({
                    'plugins': ['contextmenu'/*,'wholerow'*/],
                    'core': {
                        'multiple': false,
                        'data': {
                            'url': function (node) {
                                var url = settings.baseurl;
                                if (node.id === '#')                                    
                                    if(new QueryString().hasQuery('show'))
                                        return url + '?func=wb.GetModules&show';
                                    else
                                        return url + '?func=wb.GetModules';
                                switch (node.original.type) {
                                    case 'module':
                                        return url + '?func=wb.GetOSpaces&module=' + node.text;
                                        break;
                                    case 'ospace':
                                        return url + '?func=wb.GetOrphans&ospace=' + node.original.ospace;
                                        break;
                                    case 'object':
                                        return url + '?func=wb.GetChildren&objref=' + node.original.objref;
                                        break;
                                }
                            }
                        }
                    },
                    "contextmenu": {
                        "items": function ($node) {
                            var url = settings.baseurl;
                            var tree = $("#modules").jstree(true);
                            if ($node.original.type == 'object') {
                                return {
                                    "Properties": {
                                        "separator_before": false,
                                        "separator_after": true,
                                        "label": "Properties",
                                        "action": function (obj) {
                                            $node = tree.create_node($node);
                                            tree.edit($node);
                                        }
                                    },
                                    "NewFeature": {
                                        "separator_before": false,
                                        "separator_after": true,
                                        "label": "New Feature",
                                        "items": function (node) {
                                            return {
                                                "Properties": {
                                                    "separator_before": false,
                                                    "separator_after": true,
                                                    "label": "Properties",
                                                    "action": function (obj) {
                                                        $node = tree.create_node($node);
                                                        tree.edit($node);
                                                    }
                                                },
                                            }
                                        },
                                        _disabled: !isLocked($node)
                                    },
                                    "NewChild": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "New Child",
                                        "action": function (obj) {
                                            tree.delete_node($node);
                                        },
                                        _disabled: !isLocked($node)
                                    },
                                    "NewOrphan": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "New Orphan",
                                        "action": function (obj) {
                                            tree.delete_node($node);
                                        }
                                    },
                                    "Delete": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Delete",
                                        "action": function (obj) {
                                            tree.delete_node($node);
                                        },
                                        _disabled: !isLocked($node)
                                    },
                                    "Rename": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Rename",
                                        "action": function (obj) {
                                            tree.delete_node($node);
                                        },
                                        _disabled: !isLocked($node)
                                    },
                                    "AddToGlobals": {
                                        "separator_before": true,
                                        "separator_after": false,
                                        "label": "Add To Globals",
                                        "action": function (obj) {
                                            tree.delete_node($node);
                                        },
                                        _disabled: !isLocked($node)
                                    }
                                }                                
                            }
                            else if($node.original.type == 'ospace')
                            {
                                return {
                                    "Browser": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Browse",
                                        "action": function (obj) {                                            
                                        }
                                    },
                                    "Properties": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Properties",
                                        "action": function () {
                                            showOSpaceProperties($node);
                                        }
                                    },
                                    "Search": {
                                        "separator_before": false,
                                        "separator_after": true,
                                        "label": "Search",
                                        "action": function (obj) {                                            
                                        },                                        
                                    },
                                    "Lock": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Lock",
                                        "action": function () {
                                           $node = lockOSpace($node);                                            
                                        },
                                        _disabled : $node.original.isLocked
                                    },
                                    "Unlock": {
                                        "separator_before": false,
                                        "separator_after": true,
                                        "label": "Unlock",
                                        "action": function () {
                                            $node = unlockOSpace($node);
                                        },
                                        _disabled: !($node.original.isLocked)
                                    },
                                    "ExportOSpace": {
                                        "separator_before": false,
                                        "separator_after": false,
                                        "label": "Export OSpace",
                                        "action": function () {
                                            exportOSpace($node);
                                        }
                                    }                                    
                                }
                            };
                        }
                    }
                });

            },

            currentUrl: '',

            editors: [],

            filterFeatures: function () {
                var filters = [];

                $("#filterfeature").find('button.active').each(function () {
                    filters.push($(this).attr('data-filter'));
                });

                $.cookie("WebBuilderFilters", escape(filters.join(',')), { expires: 1000 });

                $('#features li a').each(function () {
                    var a = $(this);
                    if (filters.length > 0) {
                        var index = $.inArray(a.attr('data-inheritance'), filters);
                        if (index > -1) {
                            a.parent().show();
                        }
                        else {
                            a.parent().hide();
                        }
                        index = $.inArray('script', filters);
                        if (index > -1) {
                            if (parseInt(a.attr('data-type')) != -3) {
                                a.parent().hide();
                            }
                            else {
                                if (a.parent().is(':visible'))
                                    a.parent().show();
                            }
                        }
                    }
                    else {
                        a.parent().hide();
                    }
                });
            }

        };

        Builder.init();

        return Builder;

    };
}(window.jQuery);