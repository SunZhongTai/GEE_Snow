
var XZ_point = /* color: #d63000 */ee.Geometry.Point([87.4866673399656, 31.614326676974066]);
var SD_point = /* color: #d63000 */ee.Geometry.Point([117.4866673399656, 36.614326676974066]);
// getInfo() 函数
// 得出了SCF 的频率 可以计算每年的SCD ，但是这样只是知道增加的多少或减少了多少 还有就是开始时间以及融雪的时间，也要做一个趋势图tiff
// 知道大体的走向 以及分纬度 来计算
// 这样就不用关注中间是否有持续的时间或者间断的时间。   只是看日期是否提前或者延后就行了。
// 还有就是这里1年的定义 哪里为1年的开始。是1.1 还是10.1  感觉这里也要做全球的tiff 但是具体到地区还要做什么呢 只是做与其他的分析吗？
// 做与其他的分析 具体哪个与哪个进行分析呢。 这不就是排列组合的了吗。
// 缺乏物理机制的表述 以及模型的表述。
// 如果要做 降雪开始的日期 还好说  结束的时间的判定不大好做啊 感觉  反正都要设定一个 阈值 来计算。
// 降雪开始与结束 还好做  但是这个之间的间隔天数叫 雪季长度(这个中间肯定有无雪的天)  不大好做 以及日数 在SCF 做出来了
///  就是说这个 雪季长度 与降雪日数 肯定呈现一个正相关
//

var polygon = ee.Geometry.Polygon({
  coords: [[-180, 20], [180, 20], [180, 85], [-180, 85], [-180, 85]],
  geodesic: false
});

var EA1=ee.FeatureCollection("users/sunzhongtai122/EA1");  
var NA1=ee.FeatureCollection("users/sunzhongtai122/NA1");  
var NH1=ee.FeatureCollection("users/sunzhongtai122/NH1");  

// Map.addLayer(EA1,{},'EA1')
// Map.addLayer(NA1,{},'NA1')


//--------------------------------------------------------------------------------------

var dataset = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");    //国界线
        
//var NH = ee.Geometry(polygon, null, false);
//var xizang = China_provinces.filterBounds(XZ_point);
//var shandong= China_provinces.filterBounds(SD_point);

var geometry=NH;
Map.centerObject(geometry);
Map.addLayer(geometry,{},'geometry');

// 确定年度无雪的第一天 day of year 
// 那确定有雪的第一天呢 那他们之间的间隔是持续时间吗  不是
// 随着一年的第一天，每个像素的降雪量为零，颜色等级从紫色（较早）变为黄色（较晚）（北极极地立体投影）
// 以像素为单位计算每年无雪的第一天，使用户能够跟踪融雪时间的季节性和年际变化，以便更好地了解高纬度和山区的水文循环如何响应应对气候变化。

//  这里确定第一天 是否与雪年冲突 不确定 还是说要判定 第一天必须在雪年之后 
var startDoy = 1;   // day of year // 这里可以自定义一年中的第一天 
var startDate;
var startYear=2000;
var endYear = 2009;
// 2000 2010 2010 2020
var sy=startYear;       /// 默认  1年是365天 
// 如果StartDoy设置为183，则分析将跨越新年的也会被当做第一年
function addDateBands(img) {
  var date = img.date();
  // Get calendar day-of-year. 相对一年中的第几天
  var calDoy = date.getRelative('day', 'year');           //从1月1号开始
  var relDoy = date.difference(startDate, 'day');    // 从用户定义的日期startDate开始
  var millis = date.millis();
  var dateBands = ee.Image.constant([calDoy, relDoy,millis, startYear])
    .rename(['calDoy', 'relDoy','millis', 'year']);
  return img.addBands(dateBands).toInt16().set('millis', millis);
}

// 遮盖水，使分析仅限于地形上的像素； 2）遮盖积雪很少的像素； 3）遮盖一年中大部分时间被雪覆盖的像素（例如冰川）
// 在积雪很少的像素也就是地方 比如南方 分析积雪的提前好像没有必要   一年中全是雪的北极是没有必要分析积雪的提前或者延后
// 所以选择纬度 去掉低纬度 以及 高纬度的地方 
// 导入MODIS水/陆地遮罩数据集，选择“水遮罩”波段，并将所有陆地像素设置为值1：  
// 所以这个是否可以应用到SCA 上  因为 纬度地区没有遮盖内陆水
   var Reclassify1 = function(anImage) {
    return anImage.select('NDSI_Snow_Cover').gt(0).unmask(0)   // 找到 NDSI>0的
  };
  
var waterMask = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24')
  .select('water_mask')    
  .not();    // 0land 1 water -> 1 land 0 water
 // print('waterMask',waterMask);
//Map.addLayer(waterMask,{}, 'waterMask',false);
  var completeCol = ee.ImageCollection('MODIS/006/MOD10A1')
  .select('NDSI_Snow_Cover');  // Percent snow in cell
  
  var completeCol1=completeCol;//.map(Reclassify1);   // 但没有采用 
Map.addLayer(completeCol.filterDate('2018-01-01', '2019-01-01'),{}, 'NDSI_Snow_Cover',false);
  
  // var tt=ee.ImageCollection('MODIS/006/MOD10A1').filter(ee.Filter.date('2000-01-01', '2002-01-01'));
  // print('completeCol',tt);
  // var   firstDoy = ee.Date.fromYMD(2000, 1, 1); 
  // startDate = firstDoy.advance(startDoy-1, 'day');
  //   var ss=tt.map(addDateBands);
  // print('ss',ss);
   
  // greater than or equal   返回的是布尔值
  // 要把这两个snow 的掩膜的日期变为变量 传近去一年一年的穿进去
  // Pixels must have been 10% snow covered for at least 2 weeks in 2018.
var snowCoverEphem = completeCol.filterDate('2018-01-01', '2019-01-01')
  .map(function(img) {
    return img.gte(50);
  })
  .sum()
  .gte(0);
  
  // .sum()
  // .gte(14);     
// 一个地方的FSC至少10% 以上才可以 而且这个大于10%的天数必须得大于14天  必须小于124天  即小于4个月 要不一年全下雪 也不行
// Pixels must not be 10% snow covered more than 124 days in 2018.
var snowCoverConst = completeCol.filterDate('2018-01-01', '2019-01-01')
  .map(function(img) {
    return img.gte(50);
  })
  // .sum()
  // .lte(124);
  var analysisMask = waterMask.multiply(snowCoverEphem).multiply(snowCoverConst);
  var analysisMask1 = waterMask.multiply(snowCoverEphem);
  // 就是一年中 必须大于14天雪 小于124 天雪 4个月的雪
  //所以很多的设定为50% 的阈值来进行计算的
  // 所以更改这个阈值来看看
  // 但是这个是10 代表10%  和scf 的2分类不一样啊
  // 还是这个没有值的地方默认为0  拉低了这个平均值  所以 偏小  可以放弃这个 只搞40-60 60-80 
  //Map.addLayer(analysisMask,{}, 'analysisMask',true);

  //---------------------------------------------------------------------
  var years = ee.List.sequence(startYear, endYear);  //00-19
  // 确定积雪量为零的第一天。 定义开始日期和结束日期以过滤给定年份的数据集。 按日期范围过滤图像集合。 将日期范围添加到已过滤集合中的每个图像。
  // 按日期对过滤后的集合进行排序。 使用最小缩小器进行镶嵌，以选择雪覆盖度为0（最小）的像素。
  // 由于该集合按日期排序，因此选择了第一个雪盖为0的图像。   同理 我们选择第一个为1 的图像  选择第一天没有雪 的和第一天有雪的
  // 对每个像素执行此操作以构建完整的图像镶嵌图。 将分析镶嵌应用于所得镶嵌图。   返回一个日期list
  // Set the global startYear variable as the year being worked on so that
  // it will be accessible to the addDateBands mapped to the collection below.
//  print(ee.Algorithms.ObjectType(years));
// 看了 一个论文 降雪  终止为 3 4 5 6 7 8   初始为 1  2  9 10 11 12   这怎么算first day    

var annualList = years.map(function(year) {  // 00-19
  startYear = year;
  // Get the first day-of-year for this year as an ee.Date object.
  var firstDoy = ee.Date.fromYMD(year, 1, 1);   // 得到一年中的第一天的Date的形式
   // Advance from the firstDoy to the user-defined startDay
  startDate = firstDoy.advance(startDoy-1, 'day');    // 所以这个startDate还是从1-1号开始的
  
  // 需要提前一天 因为是左闭右开的
  var endDate = startDate.advance(1, 'year').advance(1, 'day');

  var yearCol = completeCol.filterDate(startDate, endDate);  // 00-1-1   01-1-1 
  
  // var temp=yearCol.map(addDateBands);
  // print('temp',temp);   // 4个波段还是5个波段呢
  

  // 构建一个图像，其中像素表示观测到的降雪率最低的日期范围内的第一天。
 // var noSnowImg = yearCol.map(addDateBands).sort('millis').reduce(ee.Reducer.min(5)).rename(['snowCover', 'calDoy', 'relDoy', 'millis', 'year']).updateMask(analysisMask).set('year', year);
   var noSnowImg = yearCol.map(addDateBands).sort('millis').reduce(ee.Reducer.min(5)).rename(['snowCover', 'calDoy', 'relDoy', 'millis','year']).updateMask(analysisMask1).set('year', year);
 
  //Map.addLayer(noSnowImg,{},'noSnowImg');
  //var haveSnowImg = yearCol.map(addDateBands).reduce(ee.Reducer.min(4)).rename(['snowCover', 'calDoy', 'relDoy', 'year']).updateMask(waterMask).set('year', year);
  // 所以说set() 可以在img 的基础上对properties 进行操作吗
    // Add date bands to all images in this particular collection.
    // Sort the images by time.
    // Make a mosaic composed of pixels from images that represent the
    // observation with the minimum percent snow cover (defined by the
    // NDSI_Snow_Cover band); include all associated bands for the selected image. 
    // Rename the bands - band names were altered by previous operation.
    // Apply the mask.  // Set the year as a property for filtering by later.
  // Mask by minimum snow fraction - only include pixels that reach 0 percent cover. Return the resulting image.
  return noSnowImg.updateMask(noSnowImg.select('snowCover').eq(0));
});
  
var annualList1 = years.map(function(year) {  // 00-19
  startYear = year;
  // Get the first day-of-year for this year as an ee.Date object.
  var firstDoy = ee.Date.fromYMD(year, 1, 1);   // 得到一年中的第一天的Date的形式
  // Advance from the firstDoy to the user-defined startDay
  startDate = firstDoy.advance(startDoy-1, 'day');    // 所以这个startDate还是从1-1号开始的
  
  // 需要提前一天 因为是左闭右开的
  var endDate = startDate.advance(1, 'year').advance(1, 'day');

  var yearCol = completeCol1.filterDate(startDate, endDate);
  
  // 构建一个图像，其中像素表示观测到的降雪率最高的日期范围内的第一天。
  //var noSnowImg = yearCol.map(addDateBands).reduce(ee.Reducer.min(4)).rename(['snowCover', 'calDoy', 'relDoy', 'year']).updateMask(waterMask).set('year', year);
  var haveSnowImg = yearCol.map(addDateBands).sort('millis',false).reduce(ee.Reducer.min(5)).rename(['snowCover', 'calDoy', 'relDoy','millis', 'year']).updateMask(analysisMask1).set('year', year);
  
  // 所以说set() 可以在img 的基础上对properties 进行操作吗
  return haveSnowImg.updateMask(haveSnowImg.select('snowCover').eq(0));
});
//  因为 测试的是第一天有雪的  所以是不是我们要再+1呢  确实+1  了   

var annualCol = ee.ImageCollection.fromImages(annualList);

var annualCol1 = ee.ImageCollection.fromImages(annualList1);

//print('annualCol',annualCol);

var visArgsf = {
  bands: ['calDoy'],
  min: 270,
  max: 360,
  palette: [
    '0D0887', '5B02A3', '9A179B', 'CB4678', 'EB7852', 'FBB32F', 'F0F921']};        
    // from blue to yellow 

var visArgsfn = {
  bands: ['calDoy'],
  min: 0,
  max: 160,
  palette: [
    '0D0887', '5B02A3', '9A179B', 'CB4678', 'EB7852', 'FBB32F', 'F0F921']};   
Map.addLayer(annualCol.select('calDoy'), visArgsfn, 'First day of no snow, 2000-2020',false);

Map.addLayer(annualCol1.select('relDoy','calDoy'), visArgsf, 'First day of have snow, 2000-2020',false);

//print('annualCol1',annualCol1.select('calDoy','relDoy'))

/* 可以通过这个来进行比对*/

// Subset the year of interest.
// var firstDayNoSnowYear = annualCol.filter(ee.Filter.eq('year', 2018)).first();
// print('firstDayNoSnowYear',firstDayNoSnowYear);

// Map.addLayer(firstDayNoSnowYear, visArgs, 'First day of no snow, 2018',false);
// 第一次经历零积雪的日子(蓝色代表早，黄色代表晚)。
// 冰冻的湖泊已被证明会降低邻近像素点的空气温度，导致雪融化延迟(
// 西北航道受保护的入海口与受北大西洋洋流和风影响的景观相比，没有降雪的时间更早,雪的融化更早
///----------------------------------------------------------------------
// // 进行误差分析  判断 第一天有雪的必须半年以后
// // 重要的是一个是误差分析 一个是创新点



// // Define the years to difference.  计算2015年和2005年融化时间的差异
// var firstYear = 2005;
// var secondYear = 2015;

// // Calculate difference image.
// var firstImg = annualCol.filter(ee.Filter.eq('year', firstYear))
//   .first().select('calDoy');
// var secondImg = annualCol.filter(ee.Filter.eq('year', secondYear))
//   .first().select('calDoy');
// var dif = secondImg.subtract(firstImg);  // 第一天没有雪的日期的提前或推迟

// // Define visualization arguments.
// var visArgs = {
//   min: -15,
//   max: 15,
//   palette: ['b2182b', 'ef8a62', 'fddbc7', 'f7f7f7', 'd1e5f0', '67a9cf', '2166ac']};

// //红色是负的变化 即说明15年比05年雪的融化更早 ，蓝色是正的变化  白色区域没有变化
// Map.setCenter(-95.78, 59.451, 5);
// Map.addLayer(dif, visArgs, '2015-2005 first day no snow dif',false);
// // //2015年与2005年之间融化时间的差异。  

//Calculate slope image.
var slope1 = annualCol.sort('year').select(['year', 'calDoy'])
  .reduce(ee.Reducer.linearFit());

// Define visualization arguments.
var visArgs1 = {
  min: -1,  
  max: 1,
  palette: ['b2182b', 'ef8a62', 'fddbc7', 'f7f7f7', 'd1e5f0', '67a9cf', '2166ac']};
// 果然  阈值越小 颜色越明显 为什么arcgis 里的值这么大呢
// 红色是一个负的斜率(逐渐早期的第一DOY没有雪)，白色是0，蓝色是正的(逐渐后期的第一DOY没有雪)
// Map.addLayer(slope1.select(['scale']), visArgs1, 'slope of 2000-2019 first day no snow ',true);
// 过完年后第一天没有雪的日期 红色为提前 蓝色为推迟 雪季更长  红色是异常  蓝色好些

var slope2 = annualCol1.sort('year').select(['year', 'relDoy'])
  .reduce(ee.Reducer.linearFit());
// 看看这个caldoy  或者reldoy  的影响
// Map.addLayer(slope2.select(['scale']), visArgs1, 'slope of 2000-2019 first day snow ',true);
// 第一天下雪的日期 红色提前意味着 提前 蓝色推迟 意味着推迟  红色好些  蓝色是异常


// 这个是那两个开始结束日期的tif图
// Export.image.toDrive({
//   image:slope1.select(['scale']),
//   description: "fnsd",
//   folder: "SCDD",
//   fileNamePrefix: "fnsd",
//   scale: 1000,
//   region: NH,
//   maxPixels: 67000000000
// });


// Export.image.toDrive({
//   image:slope2.select(['scale']),
//   description: "fsd",
//   folder: "SCDD",
//   fileNamePrefix: "fsd",
//   scale: 1000,
//   region: NH,
//   maxPixels: 67000000000
// });


print('hhh')


// reduce  mean 提取excel 数据

// var data1=annualCol.select('calDoy').map(function (image){
//   var dict=image.reduceRegion({
//     reducer:ee.Reducer.mean(),
//     geometry: table,
//     scale:1000
//   })
// });




//500m radius circle around a point of interest
//var aoi = ee.Geometry.Point(-94.242, 65.79).buffer(1e4);


// 就先 西藏的 降水 温度  高度 再说   MOD 11 tempreatre TRMM prediction
// MOD11A1 V6产品提供了1200 x 1200公里网格内的每日地表温度（LST）和发射率值。温度值来自MOD11_L2线束产品。在纬度30度以上，一些像素可能有多个观测值，
//而这些观测值符合晴空条件。发生这种情况时，像素值是所有合格观测值的平均值。与白天和夜间的地表温度带及其质量指示层一起提供的是MODIS波段31和32以及6个观测层。




// Import LST image collection.   所以是选择MOD11A1  daily 还是MOD11A2  8day  不管A1还是A2 反正是terra

// var dataset = ee.ImageCollection('MODIS/006/MOD11A1')
//                   .filter(ee.Filter.date('2018-01-01', '2018-05-01'));
                  
                  
// var landSurfaceTemperature = dataset.select('LST_Day_1km');


// var landSurfaceTemperatureVis = {
//   min: 13000.0,
//   max: 16500.0,
//   palette: [
//     '040274', '040281', '0502a3', '0502b8', '0502ce', '0502e6',
//     '0602ff', '235cb1', '307ef3', '269db1', '30c8e2', '32d3ef',
//     '3be285', '3ff38f', '86e26f', '3ae237', 'b5e22e', 'd6e21f',
//     'fff705', 'ffd611', 'ffb613', 'ff8b13', 'ff6e08', 'ff500d',
//     'ff0000', 'de0101', 'c21301', 'a71001', '911003'
//   ],
// };


/*

var modis = ee.ImageCollection('MODIS/MOD11A2');
var startTem = ee.Date('2015-01-01');
var dateRange = ee.DateRange(startTem, startTem.advance(1, 'year'));

// Filter the LST collection to include only images intersecting the desired
// date range.
var mod11a2 = modis.filterDate(dateRange);

// Select only the 1km day LST data band.                  LST_Day_1km	Kelvin	7500	65535	 0.02		Day land surface temperature
var modLSTday = mod11a2.select('LST_Day_1km');


var modLSTc = modLSTday.map(function(img) {
  return img
    .multiply(0.02)
    .subtract(273.15)
    .copyProperties(img, ['system:time_start']);
});

*/  // 这个是有个温度的 计算 



// var ts1 = ui.Chart.image.series({
//   imageCollection: modLSTc,
//   region: ugandaBorder,
//   reducer: ee.Reducer.mean(),
//   scale: 1000,
//   xProperty: 'system:time_start'})
//   .setOptions({
//     title: 'LST 2015 Time Series',
//     vAxis: {title: 'LST Celsius'}});
// print(ts1);





//Calculate annual mean DOY of AOI.
var annualAoiMean = annualCol.select('calDoy').map(function(img) {
  var mean = img.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 1000,
    bestEffort: true,
    maxPixels: 1e14,
    tileScale: 16,
  });
  return ee.Feature(null, mean).set('year', img.get('year'));
});

var annualAoiMean1 = annualCol1.select('relDoy').map(function(img) {
  var mean = img.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: geometry,
    scale: 1000,     // 以米为单位的工作投影的标称刻度。
    bestEffort: true,  //如果多边形在给定的比例下包含太多像素，请计算并使用一个更大的比例，以使操作成功。
    maxPixels: 1e14,   // 要减少的最大像素数。
    tileScale: 16, // 用于减小聚合块大小的缩放因子；使用较大的tileScale（例如2或4）可能会启用内存不足的计算。
  });
  return ee.Feature(null, mean).set('year', img.get('year'));
});

// var chart = ui.Chart.feature.byFeature(annualAoiMean, 'year', 'calDoy')
//   .setOptions({
//     title: 'Regional mean first day of year with no snow cover',
//     legend: {position: 'none'},
//     hAxis: {
//       title: 'Year',
//       format: '####'
//     },
//     vAxis: {title: 'Day-of-year'}});
// print(chart);

// var chart1 = ui.Chart.feature.byFeature(annualAoiMean1, 'year', 'calDoy')
//   .setOptions({
//     title: 'Regional mean first day of year with snow cover',
//     legend: {position: 'none'},
//     hAxis: {
//       title: 'Year',
//       format: '####'
//     },
//     vAxis: {title: 'Day-of-year'}});
// print(chart1);

//------------------------------------------



var noday=sy+"_no_snow_NH";
var haveday=sy+"_snow_NH";


  Export.table.toDrive({
    collection: annualAoiMean,
    description: noday,
    folder:'NSCD',
    fileFormat: 'CSV'
  });

  Export.table.toDrive({
    collection: annualAoiMean1,
    description: haveday,
    folder:'NSCD',
    fileFormat: 'CSV'
  });























// var coll = completeCol.select('NDSI_Snow_Cover') .filter(ee.Filter.calendarRange(8, 9, 'month'));
// print('coll',coll);
// Map.addLayer(coll,{},'coll');

// /// Join the time series to itself


// var afterFilter = ee.Filter.lessThan({
//   leftField: 'system:time_start',
//   rightField: 'system:time_start'
// });

// var joined = ee.ImageCollection(ee.Join.saveAll('after').apply({
//   primary: coll,
//   secondary: coll,
//   condition: afterFilter
// }));
// // 时间过滤器将传递所有按时间顺序较晚的图像。在每个图片加入后，都会在一个图片集合中存储。

// // Mann-Kendall trend test
// // 如果j时刻的EVI大于i时刻的EVI，则符号为1；如果相反为真，则为-1，否则为零（如果它们相等）。通过迭代集合并计算集合中每个图像i和后图像中每个图像j的符号（i，j）来计算这个值。

// var sign = function(i, j) { // i and j are images
//   return ee.Image(j).neq(i) // Zero case
//       .multiply(ee.Image(j).subtract(i).clamp(-1, 1)).int();
// };
// //  i=j  0   i!=j 1*(-1,1)

// var kendall = ee.ImageCollection(joined.map(function(current) {
//   var afterCollection = ee.ImageCollection.fromImages(current.get('after'));
//   return afterCollection.map(function(image) {
//     return ee.Image(sign(current, image)).unmask(0);
//   });
//   // Set parallelScale to avoid User memory limit exceeded.
// }).flatten()).reduce('sum', 2);

//     // The unmask is to prevent accumulation of masked pixels that
//     // result from the undefined case of when either current or image
//     // is masked.  It won't affect the sum, since it's unmasked to zero.
    
//     //取消掩码是为了防止由于当前或图像被屏蔽时的未定义情况而导致的被屏蔽像素的累积。它不会影响总数，因为它对zer是不加掩饰的
//     // 把0的全部都掩掉

// var palette = ['red', 'white', 'green'];
// // Stretch this as necessary.
// Map.addLayer(kendall, {palette: palette}, 'kendall',true);  //这个就是MK 突变检验

// //-------------------------------------------------------------------------------------
// //以后还要做多元线性分析 是和面积做对比呢 还是和物候 也就是和时间做对比呢


// 画图的话电脑有电脑拾色器
// temperature 
// precipition
// snow 
// from red to blue 
//  #a50026   #d73027  #f46d43  #fdae61   #fee090  #ffffff  #e0f3f8  #abd9e9  #74d9e9  #4575b4  #313695


// 关于初雪与终雪 终雪有可能在下半年  而 初雪有可能在上半年 这怎么考虑呢
// 降雪日期是指从10月到次年9月的一个水文年中，地面观测到的第一天和最后一天降雪。 在first文件夹下文献中提到 
// 但是我们的这个应该不能遵从这个规则  
// 因为  按照你的这个的话  最早也得在270 天，但是我测出来的是60-80  就已经在270天了
// 所以说这里到底准不准这个雪年的定义呢    我们是平均   
//每个像素的第一次积雪日期被确定为8月1日之后出现积雪的第一个日期。最后一次积雪日期确定为下一个有雪的日历年7月31日之前的最后一天。
// 这个不是雪年的定义 感觉这个还偏实际一点 。  snow-cover_documentation 在这篇文章中

// 积雪季节通常从一个日历年的秋天到下一个日历年的春天。
// 验证500与1000的精确度差别  不大 可以忽略 而且运行快
// 对于SCA  不同纬度间的面积不一样大  怎么处理呢   我们看的是趋势 是变化   不是自身的大小

//  这个20-40 多少有点问题  靠南 没有数据   但是 靠北的first snow 也才很靠后了 一平均 怎么更靠后了 
// 太早还涉及 一个 有可能年后才下第一场雪 那可咋办啊 
// 这种判断 雪季的长度 是年前年后都有 年前年后都没有 年前有雪 年后无   好计算 
// 年前无   年后有 这种要判断 年后开始的降雪日期啊   也就是说  有可能初始降雪时间在年后 这个比较少 
//  这个 还好  可以从自定义的日期来设置  开始的日期  这种对20-40 有没有改善作用？   试过了  自定义日期总会出现各种不能解释的问题

// 毋庸置疑的是雪季长度与降雪日数呈显著的正相关关系。 但是降雪日数从SCF  也是没有得出来啊 
//  不是  还搞错一点 今年的first no  snow  是对应的去年 的 今年的first  snow  对应 的是明年 的 啊  这个就涉及到了这个雪年的定义了
// 所有解决这种的情况就是找到下雪的最南端 进行重新计算吧  肯定的是要比10月晚。 其实更科学的是mask 掉没有雪的地方 ，但是不好做 因为会和没有雪的做平均 所以导致了first snow  太早了 毕竟没有雪的地方first snwo 是0啊
//  或许 不改变 roi  就是改变 这个 Nan =365  进行平均   进行unmask  这个也没有进行
//  设立213 的开始日期为啥显示不对啊  不知道 为啥 有错误  这样 跨年的 那种就搞不了了  就只能手动推算了  但是这还不是主要的问题 主要的问题是为什么20-40 是不对的啊
// 以后闲着的时间 要开始写论文 了  啊 
//   为了 验证 mask  掉的地方参不参与运算 test  一个是30-40  的 和20-40 差不多  一个是小地方  没有值 可还行 
// 正是因为没有值才mask 但是mask  做平均 会是什么呢 unmask???
// 现在这种情况 怎么办呢  要先做一个mk  吗 不知道   mk  和matlab 哪个效果也不好啊 是数据还是方法的问题 答案是mk 和matlab 的结果都不好 这可怎么整  别的论文是就一个可信度的交点 我这个都是交点 这可怎么整
// 看下ee.Feature(null, mean)  这个没什么好说的 就是一个键值对罢了
//  看下SCF 的NSD  结果也不对 number of snow days

// 一个是时间的20-40 的均值   一个是NSD的均值  这两个什么时候才可以搞出来啊 a a a a  a  
//   我也要进行一个随机抽样   来验证可行性   结果不重要  反正是随机 的 如果这个地方不好 就换个好的 反正重要的不是结果 而是有这个过程  证明可行性 
// 不像那些分类似的  是根据已知推未知 这个是都已经知道的情况下 只是严重精度 利用30 m-》 500m 我们进行这个的前提是都是可信的 就是这个空间分辨率的问题 即500m 在一定程度上 一定误差内是可以替换30m的  
// 既然 SCD  NSD时间有些问题  那就转换思路  看看SCF SCA 这两个 ，面积是否具有可信度  这个 也是看趋势就完事了
// 做过的这些 有没有进行去云处理？  增加点判断 可信度  去云  质量控制  然后进行小地区的实验和测试 对比 



// 说实话 不大好统计这个SCD这个参数