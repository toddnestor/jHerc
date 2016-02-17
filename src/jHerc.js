if( typeof $ != 'function' && typeof jQuery != 'function' )
    throw new Error('jHerc is a jQuery plugin and therefore requires jQuery to run.');
else
{
    (function ( $ ) {
        $.herc = {
            api_url: 'http://api.hercdev.io',
            config: {},
            fb_login_url: function() {
                return this.api_url + '/connectFB?api_key=' + this.config.api_key;
            },
            beforeSend: function(xhr ) {
                var user = localStorage.getItem('herc_user');

                if( user )
                    user = JSON.parse( user );

                if( user && user.access_token )
                    xhr.setRequestHeader("Authorization", "Basic " + user.access_token );

                if( $.herc.config && $.herc.config.api_key )
                    xhr.setRequestHeader("ApiKey", $.herc.config.api_key );
                else
                    throw new Error('You must setup your Api Key to communicate with the Herc API.');
            },
            getAll: function( api_object, parameters, success_callback, error_callback ) {
                var final_url = this.api_url + '/' + api_object;

                var parameter_strings = [];

                if( parameters )
                {
                    $.each( parameters, function( key, value ) {
                        var param_item = key + '=' + encodeURIComponent( value );

                        parameter_strings.push( param_item );
                    } );
                }

                if( parameter_strings.length > 0 )
                    final_url += '?' + parameter_strings.join('&');

                var params = {
                    method: 'GET',
                    url: final_url
                }

                return this.ajaxRequest( params, success_callback, error_callback );
            },
            getOne: function( api_object, id, success_callback, error_callback ) {
                var final_url = this.api_url + '/' + api_object + '/' + id;

                var params = {
                    method: 'GET',
                    url: final_url
                }

                return this.ajaxRequest( params, success_callback, error_callback );
            },
            post: function( api_object, data, success_callback, error_callback ) {
                var final_url = this.api_url + '/' + api_object;

                var params = {
                    method: 'POST',
                    url: final_url,
                    data: data
                }

                return this.ajaxRequest( params, success_callback, error_callback );
            },
            put: function( api_object, id, data, success_callback, error_callback ) {
                var final_url = this.api_url + '/' + api_object + '/' + id;

                data = data || {};

                data._method = 'put';

                var params = {
                    method: 'POST',
                    url: final_url,
                    data: data
                }

                return this.ajaxRequest( params, success_callback, error_callback );
            },
            ajaxRequest: function( params, success_callback, error_callback ) {
                var data = {
                    type: params.method ? params.method : 'POST',
                    url: params.url,
                    dataType: 'json',
                    beforeSend: this.beforeSend
                }

                if( params.data )
                    data.data = params.data;

                data.success = function( response ) {
                    $.herc.metaDataIze( response );
                    $.herc.metaDataIzeAll( response );

                    if( typeof success_callback == 'function' )
                        success_callback( response );
                };

                if( typeof error_callback == 'function' )
                    data.error = error_callback;

                return $.ajax( data );
            },
            metaDataIzeAll: function( objects ) {
                $.each( objects, function( key, value ) {
                    if( value && value.meta )
                    {
                        $.herc.metaDataIze( value );
                    }
                } )
            },
            metaDataIze: function( object ) {
                if( object && object.meta )
                {
                    object.meta_data = {};

                    $.each( object.meta, function( key, value ) {
                        object.meta_data[ value.key ] = value.value;
                    } );
                }
            },
            Posts: function(){
                return $.herc.Abstract('Post');
            },
            Tasks: function(){
                return $.herc.Abstract('Task');
            },
            Objects: function(){
                return $.herc.Abstract('Object');
            },
            Users: function(){
                return $.herc.Abstract('User');
            },
            Abstract: function( object ) {
                return {
                    getAll: function( parameters, success_callback, error_callback ) {
                        return $.herc.getAll( object, parameters, success_callback, error_callback );
                    },
                    getOne: function( id, success_callback, error_callback ) {
                        return $.herc.getOne( object, id, success_callback, error_callback );
                    },
                    post: function( data, success_callback, error_callback ) {
                        return $.herc.post( object, data, success_callback, error_callback );
                    },
                    put: function( id, data, success_callback, error_callback ) {
                        return $.herc.put( object, id, data, success_callback, error_callback );
                    }
                }
            },
            loginWithAccessToken: function( access_token ){
                var final_url = this.api_url + '/loginWithAccessToken';

                var params = {
                    url: final_url,
                    data: {
                        access_token: access_token
                    }
                }

                this.ajaxRequest( params, function( response ) {
                    if (typeof response.id != 'undefined' && typeof response.access_token != 'undefined') {
                        localStorage.setItem('herc_user', JSON.stringify(response));

                        var redirect_url = location.origin + location.pathname;

                        var $_GET = $.herc.getAllQueryVariables;

                        var url_params = [];

                        if( $_GET && $_GET.length > 0 )
                        {
                            $.each( $_GET, function( key, value ) {
                                if( key != 'access_token' )
                                    url_params.push( key + '=' + encodeURIComponent( value ) );
                            } )
                        }

                        if( url_params.length > 0 )
                            redirect_url += '?' + url_params.join('&');

                        location.href = redirect_url;
                    }
                } );
            },
            getQueryVariable: function (variable)
            {
                var query = window.location.search.substring(1);
                var vars = query.split("&");
                for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    if(pair[0] == variable){return pair[1];}
                }
                return(false);
            },
            getAllQueryVariables: function()
            {
                var vars = {};
                var parts = window.location.href.replace( /[?&]+([^=&]+)=([^&]*)/gi, function( m, key, value )
                {
                    vars[ key ] = decodeURIComponent( value );
                } );
                return vars;
            },
            configure: function(options) {
                if( options.api_key )
                    this.config.api_key = options.api_key;

                if( $.herc.getQueryVariable( 'access_token' ) ) {
                    $.herc.loginWithAccessToken( $.herc.getQueryVariable( 'access_token' ) );
                }
            },
            current_user: function() {
                var user = localStorage.getItem('herc_user');

                if( user )
                    user = JSON.parse( user );

                if( user )
                    return user;
                else
                    return false;
            }
        }

        $.fn.fbLoginButton = function() {
            this.css('cursor', 'pointer');
            this.click(function(e){
                e.preventDefault();
                location.href = $.herc.fb_login_url() + '&redirect_url=' + location.href;
            });

            if( $.herc.current_user() )
                this.hide();

            return this;
        };
    }( jQuery ));
}