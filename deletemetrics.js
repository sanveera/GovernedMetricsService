var qsocks = require('qsocks');
var fs = require('fs');
var request = require('request');
var promise = require('bluebird');
var path = require('path')
var Promise = require('bluebird')
var config = require('./config');


var deleteMetrics = 
{
	deleteAllMasterItems : function(cookies, appId, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'Cookie': cookies[0]
			},
			appname: appId
		};

		console.log('Deleting all MasterItem dimensions and measures from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
		})
		.then(function(app)
		{
			console.log('app opened');
			return stuff.app = app;
		})
		.then(function(app)
		{
			return stuff.measureList = stuff.app.createSessionObject(deleteMetrics.measureListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qMeasureList.qItems;
			var mList = items.filter(filterMasterItems);

			mList.forEach(function(measure)
			{
				//console.log(measure.qMeta.title + ':' + measure.qInfo.qId);
				stuff.app.destroyMeasure(measure.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				});
			}); 
		})
		.then(function()
		{
			return stuff.dimensionList = stuff.app.createSessionObject(deleteMetrics.dimensionListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qDimensionList.qItems;
			var dList = items.filter(filterMasterItems);

			dList.forEach(function(dimension)
			{
				//console.log(dimension.qMeta.title + ':' + dimension.qInfo.qId);
				stuff.app.destroyDimension(dimension.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				});
			});	
		})
		.then(function()
		{
			console.log('all done');
			callback(null, 'delete complete!');
		})
		.catch(function(error)
		{
			callback(error);
		});
	},
	deleteAllMasterItemMeasures : function(cookies, appId, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'Cookie': cookies[0]
			},
			appname: appId
		};

		console.log('Deleting all measures from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
		})
		.then(function(app)
		{
			console.log('app opened');
			return stuff.app = app;
		})
		.then(function(app)
		{
			return app.createSessionObject(deleteMetrics.measureListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qMeasureList.qItems;
			var mList = items.filter(filterMasterItems);

			mList.forEach(function(measure)
			{
				//console.log(measure.qMeta.title + ':' + measure.qInfo.qId);
				stuff.app.destroyMeasure(measure.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				})
				.then(function()
				{
					callback(null, 'made it through alive');
				})
				.catch(function(error)
				{
					callback(error);
				});
			}); 
		});
	},
	deleteAllDimensions : function(cookies, appId, callback)
	{
		var qConfig2 = {
			host: config.hostname,
			origin: 'https://' + config.hostname,
			isSecure: true,
			rejectUnauthorized: false,
			headers: {
				'Content-Type' : 'application/json',
				'x-qlik-xrfkey' : 'abcdefghijklmnop',
				'Cookie': cookies[0]
			},
			appname: appId
		};

		console.log('Deleting all dimensions from app: ' + appId);
		var stuff = {};
		stuff.appId = appId;
		
		qsocks.Connect(qConfig2)
		.then(function(global)
		{
			console.log('all good at global');
			return global;
		})
		.then(function(global)
		{
			return global.openDoc(qConfig2.appname, '', '', '', true);
		})
		.then(function(app)
		{
			console.log('app opened');
			return stuff.app = app;
		})
		.then(function(app)
		{
			return app.createSessionObject(deleteMetrics.dimensionListDef());
		})
		.then(function(obj)
		{
			return obj.getLayout();
		})
		.then(function(layout)
		{
			var items = layout.qDimensionList.qItems;
			var dList = items.filter(filterMasterItems);

			dList.forEach(function(dimension)
			{
				//console.log(dimension.qMeta.title + ':' + dimension.qInfo.qId);
				stuff.app.destroyDimension(dimension.qInfo.qId)
				.then(function(success)
				{
					console.log(success);
				})
				.then(function()
				{
					callback(null, 'made it through alive');
				})
				.catch(function(error)
				{
					callback(error);
				});
			}); 
		});
	},
	deleteMeasure : function(cookies, appId, qId, callback)
	{

	},
	deleteDimension : function(cookies, appId, qId, callback)
	{

	},
	measureListDef : function()
	{
		var measureList = 
		{
			qInfo: 
			{
				qType: "MeasureList"
			},
			qMeasureListDef: 
			{
				qType: "measure",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return measureList;
	},
	dimensionListDef : function()
	{
		var dimensionList = 
		{
			qInfo:
			{
				qType: "DimensionList"
			},
			qDimensionListDef:
			{
				qType: "dimension",
				qData: {
					title: "/title",
					tags: "/tags"
				}
			}
		};
		return dimensionList;
	}
}

function filterMasterItems(items)
{
	//console.log(items.qMeta.tags);
	if(items.qMeta.tags.indexOf("MasterItem")!=-1)
	{
		//console.log('Found One!');
		return true;
	}
	else
	{
		//console.log('Not a MasterItem');
		return false;
	} 
};




module.exports = deleteMetrics;