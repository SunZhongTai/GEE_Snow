var SD_point = /* color: #98ff00 */ee.Geometry.Point([118.67471647593977, 36.521192284804094]);
var state = /* color: #d676cf */ee.Geometry.Polygon(
        [[[-109.05, 41],
          [-111.05, 41],
          [-111.05, 42],
          [-114.05, 42],
          [-114.05, 37],
          [-109.05, 37]]]);
var polygon = ee.Geometry.Polygon({
  coords: [[-180, 60], [180, 60], [180, 80], [-180, 80], [-180, 80]],
  geodesic: false
});
          
var China_provinces = ee.FeatureCollection("users/sunzhongtai122/Provinces");

var shandong= China_provinces.filterBounds(SD_point);   // 157900 km
          
var EA1=ee.FeatureCollection("users/sunzhongtai122/EA1");  
var NA1=ee.FeatureCollection("users/sunzhongtai122/NA1");  

// Map.addLayer(EA1,{},'EA1')
// Map.addLayer(NA1,{},'NA1')

var geometry=polygon;  //
Map.addLayer(geometry,{},'geometry');
//print ('Area of bounding box in Km^2:', geometry.area().divide(1000000)); //219887 km² 猶他州
//** Define start and end years, and create list sequence of years
var startYr = 2016;
  var endYr = 2019; //** Chose 2019 because it is the last full year of data at this point
var yearList = ee.List.sequence({
  start:startYr,
  end:endYr,
  step:1});
 
//** Create start and end dates based on years 
var startDate = ee.Date.fromYMD(startYr,10,1); //*NOTE: March 2000 is the first full month of LST available
print('startDate',startDate)
var endDate = ee.Date.fromYMD(endYr+1,10,1); //**NOTE: the end date in .filterDate() is *exclusive
print('endDate',endDate)
// print('Start and end date', startDate, endDate);

//** Get MODIS temperature data
var modis = ee.ImageCollection('MODIS/006/MOD10A1');
var modisLST = modis.filterBounds(geometry)
                    .filterDate(startDate, endDate)
                    .select('NDSI_Snow_Cover'); // Daytime LST
Map.addLayer(modisLST,{},'mod');

var landMask = function(image) {
  // Only collects the 'NDSI_Snow_Cover' band
  var snowBand = image.select('NDSI_Snow_Cover');
  // Creates the mask that filters out land
  var completeLandMask = snowBand.gte(0.0);     // 問題找到了 沒有應用上整個 條件
  //----------------------------------------------------------------------------------------????????????????????
  //明显是0-100 变为了0-1 ， 所以就是个阈值的问题吗
  // Returns an image masking non-snow areas
  return image.updateMask(completeLandMask);  //只保留大于20的
};

//** Convert temperature to Celsius; also add 'year' and 'month' properties for easier filtering.
modisLST = modisLST.map(function(img){
  var date = ee.Date(img.get('system:time_start'));
  var month = date.get('month');
  var year = date.get('year');
  var cels = img.divide(100);
  return cels.set('month', month)
    .set('year',year).set('system:time_start', date);
});
Map.addLayer(modisLST,{},'mod1');

print('modisLST',modisLST);

var modisLST1=modisLST.map(landMask);
print('modisLST1',modisLST1);
Map.addLayer(modisLST,{},'mod2');

//*** Yearly average for the specified geometry (geometry4 here - smaller area) ***
//---------------------------------------------------------------------------------
//** Create annual mean LST image collection
// var yearlyLSTcoll = yearList.map(function(year){
//   return modisLST1.filter(ee.Filter.eq('year',year)).mean().set('year',year);
// });
// print('yearlyLSTcoll',yearlyLSTcoll);

// var yearlyLSTimgs = ee.FeatureCollection(yearlyLSTcoll);
// print('yearlyLSTimgs',yearlyLSTimgs);

//** Map over collection and use reduceRegion to summarize mean yearly LST over the geometry 
  // var yearlyTS = yearlyLSTimgs.map(function(image){
  //   var meanLST = ee.Image(image).reduceRegion({
  //     reducer: ee.Reducer.mean(),
  //     geometry: NH,
  //     scale: 1000,
  //     bestEffort: true,
  //     maxPixels: 10e13}).get('NDSI_Snow_Cover');
  //   var outFeat = ee.Feature(null, {'year':image.get('year'), 'meanLST': meanLST});
  //   return outFeat;
  // });
  
  // yearlyTS = ee.FeatureCollection(yearlyTS);
  // print('yearlyTS',yearlyTS);

//** Create a graph of the yearly time-series
// var yearlyGraph = ui.Chart.feature.byFeature({
//   features: yearlyTS,
//   xProperty: 'year',
//   yProperties: 'meanLST'});

// //** Print to console

// //导出比print可以允许的运行时间更长
// print(yearlyGraph.setChartType("ColumnChart")
//           .setOptions({vAxis: {title: 'LST [deg. C]'},
//                         hAxis: {title: 'Year'}}));
 
 
  // Export.table.toDrive({
  //   collection: yearlyTS,
  //   description: 'Annual_Mean_Yearly_LST',
  //   folder:'LST_CSV',
  //   fileFormat: 'CSV'
  // });
  
//*** Monthly average (over the years) for the specified geometry (geometry4 here - smaller area) ***
//---------------------------------------------------------------------------------------------------

//** Calculate number of months withiin the specified time period
var dateDiff = endDate.difference(startDate,'month');
print('dateDiff',dateDiff)
var noMonths = ee.Number(dateDiff).round().subtract(1);
print('noMonths',noMonths)    // number of  month

//** Create list of dates, one for each month in the time period
var allMonths = ee.List.sequence(0,noMonths,1);
var dateList = allMonths.map(function(monthNo){
  return startDate.advance(monthNo,'month');
});
print(dateList);  // 得出日期的 但是還是沒有見到數據啊 一直 

//** Map over date list and create per-month/year mean LST composites
var perYrMonthly = dateList.map(function(date){
  var endDate = ee.Date(date).advance(1,'month');
  var monthColl = modisLST1.filterDate(date, endDate);  // at here apply >0.2
  var monthMean = monthColl.mean();
  return monthMean.set('date',date);
});
perYrMonthly = ee.ImageCollection(perYrMonthly);

// //**  Map over collection and use reduceRegion to summarize mean monthly (per year) LST over the geometry
var monthlyTSfeats = perYrMonthly.map(function(image){
  var meanLST = ee.Image(image).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: geometry,
        scale: 1000,
        maxPixels: 10e13}).get('NDSI_Snow_Cover');
  var outFeat = ee.Feature(null, {
    'date':ee.Date(ee.Image(image).get('date')),
    'SCA': meanLST});
  return outFeat;
});
monthlyTSfeats = ee.FeatureCollection(monthlyTSfeats);
print('图',monthlyTSfeats.first());

//** Create a graph of the monthly time-series over the years
var monthlyGraph = ui.Chart.feature.byFeature({
  features: monthlyTSfeats,
  xProperty: 'date',
  yProperties: 'SCA'});

//** Print to console
print(monthlyGraph.setChartType("ColumnChart")
          .setOptions({vAxis: {title: 'Snow Covered area (Km^2)'},
                        hAxis: {title: 'Date'}}));

var name="sca_60_80_"+startYr;

  Export.table.toDrive({
    collection: monthlyTSfeats,
    description: name,
    folder:'SCA_NH_NA_EA_2',
    fileFormat: 'CSV'
  });


Export.image.toDrive({
  image:mean,
  description: "mfnsd",
  folder: "MeanSCA",
  fileNamePrefix: "mfnsd",
  scale: 1000,
  region: NH,
  maxPixels: 67000000000
});

//  01-04
// 这个目前是不出图的 只能出数据


// 去雲  
// 質量控制
// 這個月數據和日數據做月平均對應不起來
// 还有就是要不要在纬度的的基础上去除水体 有这个mask数据 
// 去云 
// 就是非雪季 为什么还有snow  cover area？
// 非雪季 高山 有雪 的原因吗 但是这个雪多少有点多了
// 不是多少的问题 应该是不同月的大小差距问题 

// 说明这个积雪多判了  可以多加些判定条件 或者 用landsat  验证一下。

// 抽空研究下这个的阈值 使他成为大约5倍的样子  看看吧  提上日程
// 测试SCA 的 精确度 准确率
// 这个大概要运行7小时才能能出来
// 就是每天 都运行一遍呗 
// 这个是月平均还是月的和
//你妈的 是冬季不差 夏季差了5倍 属于是 这给我弄不会了啊
//最后改为0 的了的阈值 应该是算是解决了这个阈值的了问题了吧
