#import "RCTNativeAppleMapsSearch.h"

#import <CoreLocation/CoreLocation.h>
#import <MapKit/MapKit.h>
#import <PDFKit/PDFKit.h>
#import <WebKit/WebKit.h>

static NSString *RCTJSONString(id value)
{
  NSError *error = nil;
  NSData *data = [NSJSONSerialization dataWithJSONObject:value options:0 error:&error];
  if (error || data == nil) {
    return nil;
  }
  return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

static NSString *RCTFormattedPostalCode(NSString *postalCode)
{
  NSString *normalized = [[[postalCode uppercaseString]
      componentsSeparatedByCharactersInSet:[[NSCharacterSet alphanumericCharacterSet] invertedSet]]
      componentsJoinedByString:@""];
  if (normalized.length == 6) {
    return [NSString stringWithFormat:@"%@ %@", [normalized substringToIndex:3], [normalized substringFromIndex:3]];
  }
  return normalized;
}

static NSString *const RCTMosqueSearchCacheKey = @"lastMosqueSearchCacheV1";
static NSString *const RCTAppPreferencesKey = @"appPreferencesV1";

@class RCTRenderedWebsiteReader;
typedef void (^RCTRenderedWebsiteReaderCompletion)(RCTRenderedWebsiteReader *reader);

@interface RCTRenderedWebsiteReader : NSObject <WKNavigationDelegate>
@property(nonatomic, strong) NSURL *url;
@property(nonatomic, strong) WKWebView *webView;
@property(nonatomic, copy) RCTPromiseResolveBlock resolve;
@property(nonatomic, copy) RCTPromiseRejectBlock reject;
@property(nonatomic, copy) RCTRenderedWebsiteReaderCompletion completion;
@property(nonatomic, assign) BOOL completed;
@property(nonatomic, assign) NSInteger readAttempts;
- (instancetype)initWithURL:(NSURL *)url
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
                 completion:(RCTRenderedWebsiteReaderCompletion)completion;
- (void)start;
- (void)attemptRenderedPageRead;
- (void)finishWithHTML:(NSString *)html;
- (void)finishWithErrorCode:(NSString *)code
                    message:(NSString *)message
                      error:(nullable NSError *)error;
@end

@implementation RCTRenderedWebsiteReader

- (instancetype)initWithURL:(NSURL *)url
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
                 completion:(RCTRenderedWebsiteReaderCompletion)completion
{
  self = [super init];
  if (self) {
    _url = url;
    _resolve = [resolve copy];
    _reject = [reject copy];
    _completion = [completion copy];
  }
  return self;
}

- (void)start
{
  WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
  configuration.websiteDataStore = [WKWebsiteDataStore nonPersistentDataStore];
  self.webView = [[WKWebView alloc] initWithFrame:CGRectMake(0, 0, 390, 844)
                                     configuration:configuration];
  self.webView.navigationDelegate = self;
  self.webView.customUserAgent = @"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  [self.webView loadRequest:[NSURLRequest requestWithURL:self.url
                                             cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
                                         timeoutInterval:9.0]];

  __weak RCTRenderedWebsiteReader *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(11.5 * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
    RCTRenderedWebsiteReader *strongSelf = weakSelf;
    if (strongSelf == nil || strongSelf.completed) {
      return;
    }
    [strongSelf finishWithErrorCode:@"rendered_page_timeout"
                            message:@"The mosque website took too long to render."
                              error:nil];
  });
}

- (void)finishWithHTML:(NSString *)html
{
  if (self.completed) {
    return;
  }
  self.completed = YES;
  self.webView.navigationDelegate = nil;
  self.webView = nil;
  self.resolve(html);
  if (self.completion) {
    self.completion(self);
  }
  self.completion = nil;
}

- (void)finishWithErrorCode:(NSString *)code
                    message:(NSString *)message
                      error:(nullable NSError *)error
{
  if (self.completed) {
    return;
  }
  self.completed = YES;
  self.webView.navigationDelegate = nil;
  [self.webView stopLoading];
  self.webView = nil;
  self.reject(code, message, error);
  if (self.completion) {
    self.completion(self);
  }
  self.completion = nil;
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation
{
  self.readAttempts = 0;
  __weak RCTRenderedWebsiteReader *weakSelf = self;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.6 * NSEC_PER_SEC)),
                 dispatch_get_main_queue(), ^{
    RCTRenderedWebsiteReader *strongSelf = weakSelf;
    if (strongSelf == nil || strongSelf.completed) {
      return;
    }
    [strongSelf attemptRenderedPageRead];
  });
}

- (void)attemptRenderedPageRead
{
  if (self.completed || self.webView == nil) {
    return;
  }
  self.readAttempts += 1;
  __weak RCTRenderedWebsiteReader *weakSelf = self;
  [self.webView evaluateJavaScript:@"document.body ? document.body.innerText : ''"
                completionHandler:^(id result, NSError *error) {
    RCTRenderedWebsiteReader *strongSelf = weakSelf;
    if (strongSelf == nil || strongSelf.completed) {
      return;
    }
    NSString *visibleText = [result isKindOfClass:[NSString class]] ? (NSString *)result : @"";
    NSString *normalizedText = visibleText.lowercaseString;
    BOOL hasFajr =
        [normalizedText containsString:@"fajr"] ||
        [normalizedText containsString:@"subh"] ||
        [normalizedText containsString:@"subuh"] ||
        [normalizedText containsString:@"subax"] ||
        [normalizedText containsString:@"sabah"] ||
        [normalizedText containsString:@"alfajiri"] ||
        [normalizedText containsString:@"фаджр"] ||
        [normalizedText containsString:@"晨礼"] ||
        [normalizedText containsString:@"晨禮"] ||
        [normalizedText containsString:@"ファジュル"] ||
        [normalizedText containsString:@"फ़ज्र"] ||
        [normalizedText containsString:@"الفجر"] ||
        [normalizedText containsString:@"فجر"] ||
        [normalizedText containsString:@"ফজর"];
    BOOL hasLatePrayer =
        [normalizedText containsString:@"isha"] ||
        [normalizedText containsString:@"maghrib"] ||
        [normalizedText containsString:@"maghreb"] ||
        [normalizedText containsString:@"icha"] ||
        [normalizedText containsString:@"isya"] ||
        [normalizedText containsString:@"cisho"] ||
        [normalizedText containsString:@"yats"] ||
        [normalizedText containsString:@"aksam"] ||
        [normalizedText containsString:@"ischa"] ||
        [normalizedText containsString:@"иша"] ||
        [normalizedText containsString:@"магриб"] ||
        [normalizedText containsString:@"宵礼"] ||
        [normalizedText containsString:@"宵禮"] ||
        [normalizedText containsString:@"昏礼"] ||
        [normalizedText containsString:@"昏禮"] ||
        [normalizedText containsString:@"イシャ"] ||
        [normalizedText containsString:@"マグリブ"] ||
        [normalizedText containsString:@"العشاء"] ||
        [normalizedText containsString:@"المغرب"] ||
        [normalizedText containsString:@"ইশা"];
    BOOL hasPrayerNames = hasFajr && hasLatePrayer;
    BOOL hasTimes = [visibleText rangeOfCharacterFromSet:[NSCharacterSet decimalDigitCharacterSet]].location != NSNotFound;
    if ((!hasPrayerNames || !hasTimes) && strongSelf.readAttempts < 4) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.75 * NSEC_PER_SEC)),
                     dispatch_get_main_queue(), ^{
        [strongSelf attemptRenderedPageRead];
      });
      return;
    }

    [strongSelf.webView evaluateJavaScript:@"document.documentElement.outerHTML"
                         completionHandler:^(id htmlResult, NSError *htmlError) {
      RCTRenderedWebsiteReader *reader = weakSelf;
      if (reader == nil || reader.completed) {
        return;
      }
      if (htmlError != nil || ![htmlResult isKindOfClass:[NSString class]]) {
        [reader finishWithErrorCode:@"rendered_page_read_failed"
                            message:@"The rendered mosque website could not be read."
                              error:htmlError ?: error];
        return;
      }
      NSString *html = (NSString *)htmlResult;
      if (html.length == 0 || html.length > 5 * 1024 * 1024) {
        [reader finishWithErrorCode:@"rendered_page_invalid"
                            message:@"The rendered mosque website was empty or too large."
                              error:nil];
        return;
      }
      [reader finishWithHTML:html];
    }];
  }];
}

- (void)webView:(WKWebView *)webView
didFailNavigation:(WKNavigation *)navigation
       withError:(NSError *)error
{
  [self finishWithErrorCode:@"rendered_page_load_failed"
                    message:@"The mosque website could not be rendered."
                      error:error];
}

- (void)webView:(WKWebView *)webView
didFailProvisionalNavigation:(WKNavigation *)navigation
       withError:(NSError *)error
{
  [self finishWithErrorCode:@"rendered_page_load_failed"
                    message:@"The mosque website could not be rendered."
                      error:error];
}

@end

@interface RCTNativeAppleMapsSearch ()
@property(nonatomic, strong) NSMutableSet<RCTRenderedWebsiteReader *> *renderedWebsiteReaders;
@end

@implementation RCTNativeAppleMapsSearch

- (instancetype)init
{
  self = [super init];
  if (self) {
    _renderedWebsiteReaders = [NSMutableSet set];
  }
  return self;
}

+ (NSString *)moduleName
{
  return @"NativeAppleMapsSearch";
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAppleMapsSearchSpecJSI>(params);
}

- (void)searchMosques:(double)latitude
            longitude:(double)longitude
          radiusMeters:(double)radiusMeters
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  CLLocationCoordinate2D center = CLLocationCoordinate2DMake(latitude, longitude);
  CLLocationDistance radius = MAX(5000.0, MIN(radiusMeters, 50000.0));
  CLLocationDegrees latitudeDelta = (radius / 111000.0) * 2.0;
  CLLocationDegrees longitudeScale = MAX(cos(latitude * M_PI / 180.0), 0.2);
  CLLocationDegrees longitudeDelta = latitudeDelta / longitudeScale;
  MKCoordinateRegion region = MKCoordinateRegionMake(
      center,
      MKCoordinateSpanMake(latitudeDelta, longitudeDelta));
  CLLocation *origin = [[CLLocation alloc] initWithLatitude:latitude longitude:longitude];

  dispatch_async(dispatch_get_main_queue(), ^{
    NSArray<NSString *> *queries = @[@"mosque", @"masjid", @"Islamic centre", @"Islamic center"];
    NSMutableDictionary<NSString *, NSDictionary *> *uniqueResults = [NSMutableDictionary dictionary];
    dispatch_group_t group = dispatch_group_create();
    __block NSInteger failedSearches = 0;

    for (NSString *query in queries) {
      MKLocalSearchRequest *request = [[MKLocalSearchRequest alloc] init];
      request.naturalLanguageQuery = query;
      request.region = region;
      request.resultTypes = MKLocalSearchResultTypePointOfInterest;
      MKLocalSearch *search = [[MKLocalSearch alloc] initWithRequest:request];
      dispatch_group_enter(group);
      [search startWithCompletionHandler:^(MKLocalSearchResponse *response, NSError *error) {
        @synchronized (uniqueResults) {
          if (error != nil) {
            failedSearches += 1;
          }

          for (MKMapItem *item in response.mapItems ?: @[]) {
            CLLocation *location = item.placemark.location;
            NSString *name = item.name;
            if (location == nil || name.length == 0 || [origin distanceFromLocation:location] > radius) {
              continue;
            }

            CLLocationCoordinate2D coordinate = location.coordinate;
            NSString *key = [NSString stringWithFormat:@"%@-%.4f-%.4f",
                             name.lowercaseString,
                             coordinate.latitude,
                             coordinate.longitude];
            if (uniqueResults[key] != nil) {
              continue;
            }

            NSMutableDictionary *result = [@{
              @"id": [NSString stringWithFormat:@"apple-%@", key],
              @"name": name,
              @"address": item.placemark.title ?: @"Address available in Maps",
              @"latitude": @(coordinate.latitude),
              @"longitude": @(coordinate.longitude),
              @"distanceMeters": @([origin distanceFromLocation:location]),
            } mutableCopy];
            if (item.url.absoluteString.length > 0) {
              result[@"website"] = item.url.absoluteString;
            }
            if (item.phoneNumber.length > 0) {
              result[@"phone"] = item.phoneNumber;
            }
            uniqueResults[key] = result;
          }
        }
        dispatch_group_leave(group);
      }];
    }

    dispatch_group_notify(group, dispatch_get_main_queue(), ^{
      NSArray<NSDictionary *> *results = [uniqueResults.allValues sortedArrayUsingComparator:
          ^NSComparisonResult(NSDictionary *left, NSDictionary *right) {
            return [left[@"distanceMeters"] compare:right[@"distanceMeters"]];
          }];
      if (results.count == 0 && failedSearches == queries.count) {
        reject(@"apple_maps_search_failed", @"Apple Maps search is temporarily unavailable.", nil);
        return;
      }
      NSString *json = RCTJSONString(results);
      if (json == nil) {
        reject(@"apple_maps_invalid_results", @"Apple Maps returned invalid results.", nil);
        return;
      }
      resolve(json);
    });
  });
}

- (void)searchPlaces:(NSString *)query
             latitude:(double)latitude
            longitude:(double)longitude
          radiusMeters:(double)radiusMeters
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  NSString *trimmedQuery = [query stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (trimmedQuery.length == 0) {
    reject(@"apple_maps_empty_query", @"Enter a mosque name to search Apple Maps.", nil);
    return;
  }

  CLLocationCoordinate2D center = CLLocationCoordinate2DMake(latitude, longitude);
  CLLocationDistance radius = MAX(5000.0, MIN(radiusMeters, 50000.0));
  CLLocationDegrees latitudeDelta = (radius / 111000.0) * 2.0;
  CLLocationDegrees longitudeScale = MAX(cos(latitude * M_PI / 180.0), 0.2);
  MKCoordinateRegion region = MKCoordinateRegionMake(
      center,
      MKCoordinateSpanMake(latitudeDelta, latitudeDelta / longitudeScale));
  CLLocation *origin = [[CLLocation alloc] initWithLatitude:latitude longitude:longitude];

  dispatch_async(dispatch_get_main_queue(), ^{
    MKLocalSearchRequest *request = [[MKLocalSearchRequest alloc] init];
    request.naturalLanguageQuery = trimmedQuery;
    request.region = region;
    request.resultTypes = MKLocalSearchResultTypePointOfInterest;
    MKLocalSearch *search = [[MKLocalSearch alloc] initWithRequest:request];
    [search startWithCompletionHandler:^(MKLocalSearchResponse *response, NSError *error) {
      if (error != nil) {
        reject(@"apple_maps_place_search_failed", @"Apple Maps could not complete that search.", error);
        return;
      }

      NSMutableArray<NSDictionary *> *results = [NSMutableArray array];
      NSMutableSet<NSString *> *seen = [NSMutableSet set];
      for (MKMapItem *item in response.mapItems ?: @[]) {
        CLLocation *location = item.placemark.location;
        NSString *name = item.name;
        if (location == nil || name.length == 0) {
          continue;
        }

        CLLocationCoordinate2D coordinate = location.coordinate;
        NSString *key = [NSString stringWithFormat:@"%@-%.4f-%.4f",
                         name.lowercaseString,
                         coordinate.latitude,
                         coordinate.longitude];
        if ([seen containsObject:key]) {
          continue;
        }
        [seen addObject:key];

        NSMutableDictionary *result = [@{
          @"id": [NSString stringWithFormat:@"apple-%@", key],
          @"name": name,
          @"address": item.placemark.title ?: @"Address available in Maps",
          @"latitude": @(coordinate.latitude),
          @"longitude": @(coordinate.longitude),
          @"distanceMeters": @([origin distanceFromLocation:location]),
        } mutableCopy];
        if (item.url.absoluteString.length > 0) {
          result[@"website"] = item.url.absoluteString;
        }
        if (item.phoneNumber.length > 0) {
          result[@"phone"] = item.phoneNumber;
        }
        [results addObject:result];
      }

      [results sortUsingComparator:^NSComparisonResult(NSDictionary *left, NSDictionary *right) {
        return [left[@"distanceMeters"] compare:right[@"distanceMeters"]];
      }];
      NSString *json = RCTJSONString(results);
      if (json == nil) {
        reject(@"apple_maps_invalid_place_results", @"Apple Maps returned invalid results.", nil);
        return;
      }
      resolve(json);
    }];
  });
}

- (void)geocodePostalCode:(NSString *)postalCode
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  NSString *formattedPostalCode = RCTFormattedPostalCode(postalCode);
  dispatch_async(dispatch_get_main_queue(), ^{
    MKLocalSearchRequest *request = [[MKLocalSearchRequest alloc] init];
    request.naturalLanguageQuery = [NSString stringWithFormat:@"%@, Canada", formattedPostalCode];
    request.resultTypes = MKLocalSearchResultTypeAddress | MKLocalSearchResultTypePointOfInterest;
    MKLocalSearch *search = [[MKLocalSearch alloc] initWithRequest:request];
    [search startWithCompletionHandler:^(MKLocalSearchResponse *response, NSError *error) {
      if (error != nil || response.mapItems.count == 0) {
        reject(@"postal_code_not_found", @"That postal code was not found in Apple Maps.", error);
        return;
      }

      NSString *normalizedQuery = [formattedPostalCode stringByReplacingOccurrencesOfString:@" " withString:@""];
      MKMapItem *bestItem = response.mapItems.firstObject;
      for (MKMapItem *item in response.mapItems) {
        NSString *itemPostalCode = [[item.placemark.postalCode ?: @"" uppercaseString]
            stringByReplacingOccurrencesOfString:@" " withString:@""];
        if ([itemPostalCode isEqualToString:normalizedQuery]) {
          bestItem = item;
          break;
        }
      }

      CLLocation *location = bestItem.placemark.location;
      if (location == nil) {
        reject(@"postal_code_no_location", @"That postal code has no mapped location.", nil);
        return;
      }

      NSDictionary *result = @{
        @"latitude": @(location.coordinate.latitude),
        @"longitude": @(location.coordinate.longitude),
        @"postalArea": formattedPostalCode,
        @"city": bestItem.placemark.locality ?: @"Local area",
        @"province": bestItem.placemark.administrativeArea ?: @"",
        @"address": bestItem.placemark.title ?: formattedPostalCode,
      };
      NSString *json = RCTJSONString(result);
      if (json == nil) {
        reject(@"postal_code_invalid_result", @"Apple Maps returned an invalid location.", nil);
        return;
      }
      resolve(json);
    }];
  });
}

- (void)geocodeAddress:(NSString *)query
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  NSString *trimmedQuery = [query stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  if (trimmedQuery.length < 2) {
    reject(@"address_query_empty", @"Enter an address or city.", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    MKLocalSearchRequest *request = [[MKLocalSearchRequest alloc] init];
    request.naturalLanguageQuery = trimmedQuery;
    request.resultTypes = MKLocalSearchResultTypeAddress | MKLocalSearchResultTypePointOfInterest;
    MKLocalSearch *search = [[MKLocalSearch alloc] initWithRequest:request];
    [search startWithCompletionHandler:^(MKLocalSearchResponse *response, NSError *error) {
      MKMapItem *item = response.mapItems.firstObject;
      CLLocation *location = item.placemark.location;
      if (error != nil || item == nil || location == nil) {
        reject(@"address_not_found", @"That address or city was not found in Apple Maps.", error);
        return;
      }

      NSArray<NSString *> *labelParts = @[
        item.placemark.locality ?: item.name ?: trimmedQuery,
        item.placemark.administrativeArea ?: @"",
        item.placemark.country ?: @"",
      ];
      NSMutableArray<NSString *> *nonEmptyParts = [NSMutableArray array];
      for (NSString *part in labelParts) {
        if (part.length > 0 && ![nonEmptyParts containsObject:part]) {
          [nonEmptyParts addObject:part];
        }
      }
      NSDictionary *result = @{
        @"latitude": @(location.coordinate.latitude),
        @"longitude": @(location.coordinate.longitude),
        @"label": nonEmptyParts.count > 0 ? [nonEmptyParts componentsJoinedByString:@", "] : trimmedQuery,
        @"address": item.placemark.title ?: trimmedQuery,
      };
      NSString *json = RCTJSONString(result);
      if (json == nil) {
        reject(@"address_invalid_result", @"Apple Maps returned an invalid location.", nil);
        return;
      }
      resolve(json);
    }];
  });
}

- (void)reverseGeocode:(double)latitude
             longitude:(double)longitude
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  CLLocation *location = [[CLLocation alloc] initWithLatitude:latitude longitude:longitude];
  CLGeocoder *geocoder = [[CLGeocoder alloc] init];
  [geocoder reverseGeocodeLocation:location
                 completionHandler:^(NSArray<CLPlacemark *> *placemarks, NSError *error) {
    CLPlacemark *placemark = placemarks.firstObject;
    if (error != nil || placemark == nil) {
      reject(@"reverse_geocode_failed", @"Your current city could not be identified.", error);
      return;
    }
    NSArray<NSString *> *parts = @[
      placemark.locality ?: placemark.subAdministrativeArea ?: @"Current location",
      placemark.administrativeArea ?: @"",
      placemark.country ?: @"",
    ];
    NSMutableArray<NSString *> *nonEmptyParts = [NSMutableArray array];
    for (NSString *part in parts) {
      if (part.length > 0 && ![nonEmptyParts containsObject:part]) {
        [nonEmptyParts addObject:part];
      }
    }
    NSDictionary *result = @{
      @"latitude": @(latitude),
      @"longitude": @(longitude),
      @"label": [nonEmptyParts componentsJoinedByString:@", "],
      @"address": placemark.name ?: [nonEmptyParts componentsJoinedByString:@", "],
    };
    NSString *json = RCTJSONString(result);
    if (json == nil) {
      reject(@"reverse_geocode_invalid", @"The current location result was invalid.", nil);
      return;
    }
    resolve(json);
  }];
}

- (void)extractPdfText:(NSString *)url
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  NSURL *documentURL = [NSURL URLWithString:url];
  if (documentURL == nil || ![documentURL.scheme.lowercaseString hasPrefix:@"http"]) {
    reject(@"invalid_pdf_url", @"The prayer timetable URL is invalid.", nil);
    return;
  }

  NSURLSessionDataTask *task = [[NSURLSession sharedSession]
      dataTaskWithURL:documentURL
    completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
      if (error != nil || data.length == 0) {
        reject(@"pdf_download_failed", @"The prayer timetable PDF could not be downloaded.", error);
        return;
      }
      if (data.length > 15 * 1024 * 1024) {
        reject(@"pdf_too_large", @"The prayer timetable PDF is too large to read safely.", nil);
        return;
      }

      PDFDocument *document = [[PDFDocument alloc] initWithData:data];
      if (document == nil || document.pageCount == 0) {
        reject(@"invalid_pdf", @"The prayer timetable PDF could not be read.", nil);
        return;
      }

      NSMutableString *text = [NSMutableString string];
      for (NSInteger pageIndex = 0; pageIndex < document.pageCount; pageIndex += 1) {
        NSString *pageText = [document pageAtIndex:pageIndex].string;
        if (pageText.length > 0) {
          [text appendString:pageText];
          [text appendString:@"\n"];
        }
      }
      if (text.length == 0) {
        reject(@"pdf_has_no_text", @"This prayer timetable is an image-only PDF.", nil);
        return;
      }
      resolve(text);
    }];
  [task resume];
}

- (void)extractRenderedWebsiteHTML:(NSString *)url
                           resolve:(RCTPromiseResolveBlock)resolve
                            reject:(RCTPromiseRejectBlock)reject
{
  NSURL *websiteURL = [NSURL URLWithString:url];
  NSString *scheme = websiteURL.scheme.lowercaseString;
  if (websiteURL == nil || ![scheme isEqualToString:@"https"]) {
    reject(@"invalid_website_url", @"The mosque website URL is invalid.", nil);
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    __weak RCTNativeAppleMapsSearch *weakSelf = self;
    RCTRenderedWebsiteReader *reader = [[RCTRenderedWebsiteReader alloc]
        initWithURL:websiteURL
            resolve:resolve
             reject:reject
         completion:^(RCTRenderedWebsiteReader *completedReader) {
      [weakSelf.renderedWebsiteReaders removeObject:completedReader];
    }];
    [self.renderedWebsiteReaders addObject:reader];
    [reader start];
  });
}

- (void)readMosqueSearchCache:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  NSString *payload = [[NSUserDefaults standardUserDefaults] stringForKey:RCTMosqueSearchCacheKey];
  resolve(payload ?: @"");
}

- (void)saveMosqueSearchCache:(NSString *)payloadJson
                       resolve:(RCTPromiseResolveBlock)resolve
                        reject:(RCTPromiseRejectBlock)reject
{
  NSData *payloadData = [payloadJson dataUsingEncoding:NSUTF8StringEncoding];
  if (payloadData.length > 2 * 1024 * 1024) {
    reject(@"mosque_cache_too_large", @"The saved mosque search is too large.", nil);
    return;
  }
  [[NSUserDefaults standardUserDefaults] setObject:payloadJson forKey:RCTMosqueSearchCacheKey];
  resolve(@YES);
}

- (void)readAppPreferences:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  NSString *payload = [[NSUserDefaults standardUserDefaults] stringForKey:RCTAppPreferencesKey];
  resolve(payload ?: @"");
}

- (void)saveAppPreferences:(NSString *)payloadJson
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  NSData *payloadData = [payloadJson dataUsingEncoding:NSUTF8StringEncoding];
  if (payloadData.length > 64 * 1024) {
    reject(@"preferences_too_large", @"The app preferences are too large.", nil);
    return;
  }
  [[NSUserDefaults standardUserDefaults] setObject:payloadJson forKey:RCTAppPreferencesKey];
  resolve(@YES);
}

@end
