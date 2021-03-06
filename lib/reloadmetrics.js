var Promise = require('bluebird');
var config = require('../config/config');
var winston = require('winston');
var qrsInteract = require('./qrsInstance');
var appDataSegment = require('./getAppDataSegment');
require('winston-daily-rotate-file');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.DailyRotateFile)({ filename: config.logging.logFile, prepend:true})
    ]
});

var reloadMetrics = {

	reloadMetrics: function(app, taskName)
	{
		var currContentHash;
		return new Promise(function(resolve, reject)
		{
			
			// return appDataSegment.getAppDataSegment(app)
			// .then(function(result)
			// {
			// 	currentContentHash = result.contentHash;
				logger.info('reloadMetrics::Starting Task::' + taskName, {module: 'reloadmetrics'});
				var path = "/task/start/synchronous";
				path += "?name=" + taskName;
				logger.debug('reloadMetrics::PATH::' + path, {module: 'reloadmetrics'});
				return qrsInteract.Post(path)
				.then(function(result)
				{
					var taskId = result.body.value;
					if(typeof result.body =='object')
					{
						logger.info('reloadMetrics::Task Started::' + taskName, {module: 'reloadmetrics'});
						return progressCheck(taskId, function(error, result)
						{
							//now that we are done, let's evaluate the result
							if(error)
							{
								logger.error('reloadMetrics::progressCheck::' + error, {module: 'reloadmetrics'});
								reject(new Error(error));
							}
							else
							{
								logger.info('reloadMetrics::Task Complete::' + taskName, {module: 'reloadmetrics'});
								var path2 = "/executionresult";
								path2 += "?filter=executionid eq " + taskId;
								logger.debug('reloadMetrics::PATH::' + path2, {module: 'reloadmetrics'});
								return qrsInteract.Get(path2)
								.then(function(reloadInfo)
								{

									logger.info('reloadMetrics::Task Completed in ' + reloadInfo.body[0].duration + 'milliseconds', {module: 'reloadmetrics'});
									logger.info('reloadMetrics::Final Task Message: ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length-1].message, {module: 'reloadmetrics'})
									// hashCheck(app,currentContentHash,function(error,result)
									// {
									// 	if(error)
									// 	{
									// 		logger.error('reloadMetrics::progressCheck::' + error, {module: 'reloadMetrics'});
									// 		reject(new Error(error));
									// 	}
									// 	else
									// 	{
									// 		logger.info('reloadMetrics::Content Hash changed on app data segment for ' + app.name, {module: 'reloadmetrics'});
									resolve('Task Completed in ' + reloadInfo.body[0].duration + ' milliseconds with message ' + reloadInfo.body[0].details[reloadInfo.body[0].details.length-1].message);
									// 	}
									// })									
								})
								.catch(function(error)
								{
									logger.error('reloadMetrics::Task Failure::' + error, {module: 'reloadmetrics'});
									reject(new Error(error));
								});
							}
						});
					}
					else
					{
						logger.error('reloadMetrics::' + JSON.stringify(result.body), {module: 'reloadmetrics'});
						reject(new Error(result));
					}
				})
				.catch(function(error)
				{
					reject(new Error(error));
				});
			})
			.catch(function(error)
			{
				reject(error);
			});
		// });
	}
};

function progressCheck(id, callback)
{
	//console.log(reload);
	var path = "/executionsession";
	path += "?filter=id eq " + id;
	logger.debug('progressCheck::PATH::' + path, {module: 'reloadmetrics'});
	return qrsInteract.Get(path)
	.then(function(reloadProgress)
	{
		if(reloadProgress.body===undefined || reloadProgress.body.length == 0)
		{
			logger.info('reloadMetrics::progressCheck::Task Complete', {module: 'reloadmetrics'});
			return callback(null,'Reload Complete');
		}
		else
		{
			var reloadStep = reloadProgress.body[0].executionResult.details.length;
			logger.debug('reloadMetrics::progressCheck::' + reloadProgress.body[0].executionResult.details[reloadStep-1].message, {module: 'reloadmetrics'});	
			return progressCheck(id,callback);
		}
	})
	.catch(function(error)
	{
		logger.error('reloadMetrics::progressCheck::' + error, {module: 'reloadmetrics'});
		return callback(error);
	});
}

function hashCheck(app, currentHash, callback)
{
	var newHash;
	return appDataSegment.getAppDataSegment(app)
	.then(function(result)
	{
		logger.debug("AppDataSegment return value: " + JSON.stringify(result), {module: 'reloadMetrics'});
		logger.debug('reloadMetrics::hashCheck::New Hash::' + result.contentHash, {module: 'reloadMetrics'});
		newHash = result.contentHash;
		if(newHash===currentHash)
		{
			logger.debug('reloadMetrics::hashCheck::Has has not changed::' + newHash + '==' + currentHash, {module: 'reloadMetrics'});
			hashCheck(app,currentHash, callback);
		}
		else
		{
			logger.debug('reloadMetrics::hashCheck::Has has changed::' + newHash + '!=' + currentHash, {module: 'reloadMetrics'});
			callback(null, 'Hash Changed');
		}
	})
	.catch(function(error)
	{
		logger.error('reloadMetrics::hashCheck::' + JSON.stringify(error), {module: 'reloadMetrics'});
		callback(error);
	});
}

module.exports = reloadMetrics;