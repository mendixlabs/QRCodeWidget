define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/_base/array",
    "dojo/_base/lang",

    "QRCodeWidget/lib/qr"
], function (declare, _WidgetBase, dojoStyle, dojoConstruct, domGeom, dojoArray, lang, qr) {
    "use strict";

    return declare("QRCodeWidget.widget.QRCodeWidget", [ _WidgetBase ], {

        // Parameters configured in the Modeler.
        barcodeValue: "",
        barcodeSize: 100,
        barcodeResponsive: false,
        barcodeType: "canvas",
        barcodeFGColor: "#000000",
        barcodeBGColor: "#FFFFFF",

        // Internal variables
        _elementType: "canvas",
        _barcodeNode: null,
        _handles: [],
        _resizeTimer: null,
        _contextObj: null,

        postCreate: function () {
            logger.debug(this.id + ".postCreate");
            this._handles = [];

            this._elementType = (this.barcodeType === "canvas") ? "canvas" : "img";
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._resetSubscriptions();
            this._updateRendering(callback);
        },

        resize: function () {
            if (this.barcodeResponsive) {
                if (this._resizeTimer) {
                    clearTimeout(this._resizeTimer);
                }

                this._resizeTimer = setTimeout(lang.hitch(this, function () {
                    logger.debug(this.id + ".resize");
                    this._updateRendering();
                }), 50);
            }
        },

        _getSize: function () {
            if (this.barcodeResponsive && this.domNode.parentElement) {
                var position = domGeom.position(this.domNode.parentElement, false);
                return position.w > 0 ? position.w : this.barcodeSize;
            } else {
                return this.barcodeSize;
            }
        },

        _generateQr: function (value, callback) {
            logger.debug(this.id + "._generateQr");
            var options = {
                value: value,
                size: this._getSize(),
                background: this.barcodeBGColor,
                foreground: this.barcodeFGColor
            };

            if (this.barcodeType === "canvas") {
                options.canvas = this._barcodeNode;
                qr.canvas(options);
            } else {
                options.image = this._barcodeNode;
                options.mime = this.barcodeType === "imgpng" ? "image/png" : "image/jpeg";
                qr.image(options);
            }

            callback && callback();
        },

        _updateRendering: function (callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");

                this._contextObj.fetch(this.barcodeValue, lang.hitch(this, function (value) {

                    if (this._barcodeNode) {
                        dojoConstruct.destroy(this._barcodeNode);
                    }

                    if (value === "") {
                        dojoStyle.set(this.domNode, "display", "none");
                        callback && callback();
                    } else {
                        this._barcodeNode = dojoConstruct.create(this._elementType, {}, this.domNode);
                        this._generateQr(value, callback);
                    }

                }));
            } else {
                dojoStyle.set(this.domNode, "display", "none");
                callback && callback();
            }
        },

        _resetSubscriptions: function () {
            logger.debug(this.id + "._resetSubscriptions");

            if (this._handles) {
                dojoArray.forEach(this._handles, function (handle) {
                    mx.data.unsubscribe(handle);
                });
                this._handles = [];
            }

            if (this._contextObj) {
                var objectHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._updateRendering();
                    })
                });

                var attrHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.barcodeValue,
                    callback: lang.hitch(this, function (guid, attr, attrValue) {
                        this._updateRendering();
                    })
                });

                this._handles = [ objectHandle, attrHandle ];
            }
        }
    });
});

require(["QRCodeWidget/widget/QRCodeWidget"]);
