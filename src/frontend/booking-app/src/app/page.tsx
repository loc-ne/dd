"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import locationData from "./data.json";

interface Ward {
  ward_code: string;
  ward_name: string;
  unit_type: string;
  lat: number;
  long: number;
}

interface District {
  district_code: string;
  district_name: string;
  unit_type: string;
  lat: number;
  long: number;
  wards: Ward[];
}

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState({
    city: "",
    district: "",
    ward: "",
  });

  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  useEffect(() => {
    fetchFeaturedRooms();
  }, []);

  const fetchFeaturedRooms = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rooms?limit=8&sort=createdAt:DESC`);
      const result = await response.json();

      if (result.success && result.data) {
        setFeaturedRooms(result.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching featured rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (cityName: string) => {
    setSearchQuery({ city: cityName, district: "", ward: "" });
    
    const selectedCity = locationData.cities.find(
      (c) => c.city_name === cityName
    );
    
    if (selectedCity) {
      setDistricts(selectedCity.districts);
      setWards([]);
    } else {
      setDistricts([]);
      setWards([]);
    }
  };

  const handleDistrictChange = (districtName: string) => {
    setSearchQuery({ ...searchQuery, district: districtName, ward: "" });
    
    const selectedDistrict = districts.find(
      (d) => d.district_name === districtName
    );
    
    if (selectedDistrict) {
      setWards(selectedDistrict.wards);
    } else {
      setWards([]);
    }
  };

  const handleWardChange = (wardName: string) => {
    setSearchQuery({ ...searchQuery, ward: wardName });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.city) params.append("city", searchQuery.city);
    if (searchQuery.district) params.append("district", searchQuery.district);
    if (searchQuery.ward) params.append("ward", searchQuery.ward);

    router.push(`/search?${params.toString()}`);
  };

  const popularCities = [
    { name: "Hồ Chí Minh", image: "/cities/hcm.jpg" },
    { name: "Hà Nội", image: "/cities/hanoi.jpg" },
    { name: "Đà Nẵng", image: "/cities/danang.jpg" },
  ];
  const cityPhrase = "Thành phố";
  const features = [
    {
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      title: "Đa dạng lựa chọn",
      description: "Hàng ngàn phòng trọ chất lượng từ khắp cả nước",
    },
    {
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "Xác thực tin cậy",
      description: "Mọi tin đăng đều được kiểm duyệt kỹ lưỡng",
    },
    {
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Giá cả minh bạch",
      description: "Không phí ẩn, giá niêm yết rõ ràng",
    },
    {
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Đặt phòng nhanh chóng",
      description: "Liên hệ trực tiếp chủ nhà dễ dàng",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-16 pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Tìm phòng trọ phù hợp
              <br />
              <span className="text-blue-600">dễ dàng & nhanh chóng</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Khám phá phòng trọ chất lượng với giá cả hợp lý tại các thành phố lớn
            </p>

            {/* Search Box */}
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    <span className="flex items-center gap-2">
                      Thành phố
                    </span>
                  </label>
                  <select
                    value={searchQuery.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white cursor-pointer hover:border-blue-400"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232563eb\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">Chọn thành phố...</option>
                    {locationData.cities.map((city) => (
                      <option key={city.city_code} value={city.city_name}>
                        {city.city_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    <span className="flex items-center gap-2">
                      Quận/Huyện
                    </span>
                  </label>
                  <select
                    value={searchQuery.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!searchQuery.city}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white cursor-pointer hover:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232563eb\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">
                      {searchQuery.city ? "Chọn quận/huyện..." : "Chọn thành phố trước"}
                    </option>
                    {districts.map((district) => (
                      <option key={district.district_code} value={district.district_name}>
                        {district.district_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    <span className="flex items-center gap-2">

                      Phường/Xã
                    </span>
                  </label>
                  <select
                    value={searchQuery.ward}
                    onChange={(e) => handleWardChange(e.target.value)}
                    disabled={!searchQuery.district}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white cursor-pointer hover:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%232563eb\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">
                      {searchQuery.district ? "Chọn phường/xã..." : "Chọn quận/huyện trước"}
                    </option>
                    {wards.map((ward) => (
                      <option key={ward.ward_code} value={ward.ward_name}>
                        {ward.ward_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm ngay
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Chúng tôi cam kết mang đến trải nghiệm tìm kiếm và thuê phòng trọ tốt nhất
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Địa điểm phổ biến
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Khám phá phòng trọ tại các thành phố lớn
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularCities.map((city, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery({ ...searchQuery, city: `${cityPhrase} ${city.name}` });
                  router.push(`/search?city=${encodeURIComponent(`${cityPhrase} ${city.name}`)}`);
                }}
                className="group relative h-48 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                {city.image ? (
                  <img
                    src={city.image}
                    alt={city.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                <div className="absolute inset-0 bg-blue-600/20 z-10 opacity-0 group-hover:opacity-100 transition" />
                <div className="absolute bottom-4 left-4 z-20 text-left">
                  <h3 className="text-white font-bold text-xl mb-1">{city.name}</h3>
                  <p className="text-white/90 text-sm">Khám phá →</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 mb-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Bạn có phòng trọ cần cho thuê?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Đăng tin miễn phí và tiếp cận hàng ngàn người tìm phòng mỗi ngày
            </p>
            <Link
              href="/dashboard/my-rooms"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl"
            >
              Đăng tin cho thuê
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
