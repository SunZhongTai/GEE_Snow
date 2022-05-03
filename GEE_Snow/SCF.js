
// https://sites.google.com/site/globalsnowobservatory/home/Presentations-and-Tutorials/aag-workshop/reducing-and-visualizing


var NH_NSD = ee.Geometry.Polygon({
  coords: [[-180, 60], [180, 60], [180, 80], [-180, 80], [-180, 80]],
  geodesic: false
});


var polygon = ee.Geometry.Polygon({
  coords: [[-180, 0], [180, 0], [180, 85], [-180, 85], [-180, 85]],
  geodesic: false
});
var NH = ee.Geometry(polygon, null, false);

Map.addLayer(NH,'','My Domain');


var MergeBands = function(aRow) {
  var anImage = ee.Image.cat(aRow.get('primary'), aRow.get('secondary'));
  return anImage;
};


// A function to assign high sensor zenith angle cells to null
var CorrectSensorPixels = function(anImage) {
  var LT25 = anImage.select('SensorZenith').lte(2500); // Angle is stored as angle * 100 in MOD09
  return anImage.mask(LT25);
};

// A function to reclassify MODIS snow cover products (MOD10A1/A2) values
// snow/ice--1; no snow/ice--0; all others--null
var Reclassify = function(anImage) {
  var ClassifiedImage = anImage.remap([100, 200,  25,  37,  39],   // Original pixel values from MODIS Snow Products
                                      [  1,   1,   0,   0,   0],   // Reclassified values: 1--snow/ice; 0--no snow/ice
                                      null,                        // All other MODIS snow product pixel values (0, 1, 11, 50, 254, 255)
                                      'Snow_Cover_Daily_Tile');    // The band we wish to remap
  return ClassifiedImage;
};


 var Reclassify1 = function(anImage) {
    return anImage.select('NDSI_Snow_Cover').gt(0).unmask(0)
  };
  
 var Reclassify2 = function(anImage) {
    return anImage.divide(100);
  };
  //--------------------------------------------------------------------------------------------------------------------                                 


// Prepare MODIS snow cover data for calculating snow cover frequency
// Join MOD09 and MOD10, mask out cells with gte 25 sensor-zenith-angle, and reclassify to: 1, 0, null
var PrepareModisSnowCover = function(StartDate, EndDate) {
  // Create MOD09GA and MOD10A1 image collections for the time period
  var MOD09GA = ee.ImageCollection('MODIS/006/MOD09GA').select('SensorZenith')   // 6 2000-02-24T00:00:00 - 2020-11-20T00:00:00
                                             .filterDate(StartDate, EndDate); 
  var MOD10A1 = ee.ImageCollection('MOD10A1').select('Snow_Cover_Daily_Tile')
                                            .filterDate(StartDate, EndDate);  // 5 2000-02-24T00:00:00 - 2017-03-30T00:00:00
                                            
                                            
  var MOD10A1_ = ee.ImageCollection('MODIS/006/MOD10A1').select('NDSI_Snow_Cover')                                          
                                            .filterDate(StartDate, EndDate);   // 6 2000-02-24T00:00:00 - 2020-10-16T00:00:00

  // Define the join type and filter
  var innerJoin = ee.Join.inner();
  var joinFilter = ee.Filter.equals({'leftField': 'system:time_start', 'rightField': 'system:time_start'});

  // Join the two collections, passing entries through the filter
  var joinedMods = ee.ImageCollection(innerJoin.apply(MOD09GA, MOD10A1_, joinFilter));

  // Map our functions over the Image Collections 
  var FinalModisDataset = joinedMods.map(MergeBands)
                                    .map(CorrectSensorPixels)
                                    .map(Reclassify1);  
  return FinalModisDataset;
};  // -------PrepareModis



var CalculateSnowCoverNumOfSnowDays = function(ModisSnowCover) {                // We hand the function our final MODIS dataset
  var NumOfSnowDays =  ModisSnowCover.sum();                                // Calculate the number of days with snow cover with .sum()
  
  return NumOfSnowDays;
};

var CalculateSnowCoverNumOfValidObsDays = function(ModisSnowCover) {                // We hand the function our final MODIS dataset
  var NumOfValidObsDays =  ModisSnowCover.count();                                // Calculate the number of days with snow cover with .sum()
  return NumOfValidObsDays;
};

var CalculateSnowCoverFrequency = function(ModisSnowCover) {                // We hand the function our final MODIS dataset
  var NumOfSnowDays =  ModisSnowCover.sum();                                // Calculate the number of days with snow cover with .sum()
  var NumOfValidObsDays = ModisSnowCover.count();                           // Count the number of days with a valid observation with .count()
  var SnowCoverFrequency = NumOfSnowDays.divide(NumOfValidObsDays);         // perform the calculation
  return SnowCoverFrequency;
};



// var WaterYearStartDates = ['2000-10-01','2001-10-01','2002-10-01','2003-10-01','2004-10-01','2005-10-01','2006-10-01','2007-10-01','2008-10-01','2009-10-01','2010-10-01','2011-10-01','2012-10-01','2013-10-01','2014-10-01','2015-10-01','2016-10-01','2017-10-01','2018-10-01','2019-10-01'];
// var WaterYearEndDates =   ['2001-09-30','2002-09-30','2003-09-30','2004-09-30','2005-09-30','2006-09-30','2007-09-30','2008-09-30','2009-09-30','2010-09-30','2011-09-30','2012-09-30','2013-09-30','2014-09-30','2015-09-30','2016-09-30','2017-09-30','2018-09-30','2019-09-30','2020-09-30'];

var WaterYearStartDates = ['2000-10-01','2001-10-01','2002-10-01','2003-10-01','2004-10-01','2005-10-01','2006-10-01','2007-10-01','2008-10-01','2009-10-01'];
var WaterYearEndDates =   ['2001-09-30','2002-09-30','2003-09-30','2004-09-30','2005-09-30','2006-09-30','2007-09-30','2008-09-30','2009-09-30','2010-09-30'];


// var WaterYearStartDates = ['2010-10-01','2011-10-01','2012-10-01','2013-10-01','2014-10-01','2015-10-01','2016-10-01','2017-10-01','2018-10-01','2019-10-01'];
// var WaterYearEndDates =   ['2011-09-30','2012-09-30','2013-09-30','2014-09-30','2015-09-30','2016-09-30','2017-09-30','2018-09-30','2019-09-30','2020-09-30'];


var WaterYearSCFImages = [];      // Create an array to add images to
var WaterYearNSDImages = [];      // Create an array to add images to
var WaterYearNVDImages =[];
for (var i = 0; i < WaterYearStartDates.length; i++) { 
  var SCF = CalculateSnowCoverFrequency( PrepareModisSnowCover(WaterYearStartDates[i], WaterYearEndDates[i]) );   // Remember that PrepareModisSnowCover takes two dates, a start and an end
  var NSD = CalculateSnowCoverNumOfSnowDays( PrepareModisSnowCover(WaterYearStartDates[i], WaterYearEndDates[i]) );   // Remember that PrepareModisSnowCover takes two dates, a start and an end
  var NVD = CalculateSnowCoverNumOfValidObsDays( PrepareModisSnowCover(WaterYearStartDates[i], WaterYearEndDates[i]) );   // Remember that PrepareModisSnowCover takes two dates, a start and an end

  
  var waterYearSCFImage =  ee.Image(i+2000).rename('year')                                 // Create an image with a constant value everywhere, that value being the End Year
                            .addBands( SCF.select(['NDSI_Snow_Cover'], ['Snow Cover Frequency']) ).toDouble();
  
  var WaterYearNSDImage =   ee.Image(i+2000).rename('year')                            // Create an image with a constant value everywhere, that value being the End Year
                            .addBands( NSD.select(['NDSI_Snow_Cover'], ['NumOfSnowDays']) ).toDouble();                          
                            
  var WaterYearNVDImage =    ee.Image(new Date(WaterYearEndDates[i]).getFullYear()).rename('year')                                 // Create an image with a constant value everywhere, that value being the End Year
                            .addBands( NVD.select(['NDSI_Snow_Cover'], ['NumOfValidObsDays']) ).toDouble();     
                            
  WaterYearSCFImages.push(waterYearSCFImage);
  WaterYearNSDImages.push(WaterYearNSDImage);
  WaterYearNVDImages.push(WaterYearNVDImage);  
}


var WaterYearSCFImages = ee.ImageCollection(WaterYearSCFImages);    
var WaterYearNSDImages = ee.ImageCollection(WaterYearNSDImages); 
var WaterYearNVDImages = ee.ImageCollection(WaterYearNVDImages); 

Map.setCenter(100.78, 40.451, 4);
// 'year',
 Map.addLayer(WaterYearSCFImages.select('Snow Cover Frequency'),{ },'WaterYearSCFImages',false);
 Map.addLayer(WaterYearNVDImages.select('NumOfValidObsDays'),{ },'WaterYearNVDImages',false);
 

var LinearFit0 = WaterYearSCFImages.select('year','Snow Cover Frequency').reduce(ee.Reducer.linearFit());
var LinearFit1 = WaterYearNSDImages.select('year','NumOfSnowDays').reduce(ee.Reducer.linearFit());
//  brown  to  blue  值越大越蓝
var BlueToBrown = ['964B00', 'A15F1C', 'AD7338', 'B98755', 'C49B71', 'D0AF8D', 'DCC3AA', 'E7D7C6', 'F3EBE2', 'FFFFFF',
                   'E7F1FA', 'CFE4F6', 'B7D7F2', '9FCAED', '88BDE9', '70B0E5', '58A3E0', '4096DC', '2989D8'];
                   
// Map.addLayer(LinearFit0.select(['scale']), {'min':-0.003, 'max':0.003,'palette':BlueToBrown}, 'Snow Cover Frequency Linear Trend',true);
Map.addLayer(LinearFit0.select(['scale']), {min:-0.001, max:0.001, palette:BlueToBrown}, 'Snow Cover Frequency Linear Trend',true);

// 20年  10 年 都得是0.003 左右   反正0.03 是太淡了 不行 至于为什么变小为0.003颜色就加深了呢  映射集 变小 颜色加深


Export.image.toDrive({
  image:LinearFit0.select(['scale']),
  description: "scf",
  folder: "SCF",
  fileNamePrefix: "scf",
  scale: 1000,
  region: NH,
  maxPixels: 67000000000
});
//  这里本来是500 的 我想给他弄成1000 的



// 可以通过加大scale 来体现区域性 还可以加快运行速度
// 0.003 0.03 所有低于最小值的值都将被压缩为最小值。高于最大值的所有值都将被压缩为最大值。 

var LinearFitNoZero0 = LinearFit0.select(['scale']).mask(LinearFit0.select(['scale']).neq(0));
print('LinearFit0',LinearFit0);
// Create a RGB image for sharing on Map Engine
var imageToExport0 = LinearFitNoZero0.visualize({'min':-0.003, 'max':0.003, 'palette':BlueToBrown, 'forceRgbOutput':true});

Map.addLayer(imageToExport0,{},'LinearFitNoZeroTutorial0', false);
 
 

 
 
 // 根据纬度 得出number snow of days   这个是计算雪的天数与雪季长度的关系的


var numofdays = WaterYearNSDImages.select('NumOfSnowDays').map(function(img) {
  var mean = img.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 500,     // 以米为单位的工作投影的标称刻度。
    bestEffort: true,  //如果多边形在给定的比例下包含太多像素，请计算并使用一个更大的比例，以使操作成功。
    maxPixels: 1e14,   // 要减少的最大像素数。
    tileScale: 16, // 用于减小聚合块大小的缩放因子；使用较大的tileScale（例如2或4）可能会启用内存不足的计算。
  });
  return ee.Feature(null, mean).set('year', img.get('year'));
});


  Export.table.toDrive({
    collection: numofdays,
    description: 'NSD_small_500',
    folder:'NSD',
    fileFormat: 'CSV'
  });
