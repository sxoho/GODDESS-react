import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { axiosInstance } from "../../../components/ToolBak";
import "../../../styles/admin/AdminProductForm.css";

type ProductForm = {
  brand: string;
  name: string;
  mainCategoryId: string;
  categoryId: string;
  price: string;
  discount: string;
  description: string;
  usageInfo: string;
  productType: string;
  volume: string;
  skinType: string;
  personalColor: string;
  aiApplyEnabled: string;
  status: string;
};

type ProductImageForm = {
  id: number;
  file?: File;
  fileName: string;
  filePath?: string;
  imageType: "THUMBNAIL" | "DETAIL";
  isMain?: string;
  sortOrder?: number;
};

type ProductColorForm = {
  id: number;
  backendId?: number;
  masterColorId?: number;
  colorName: string;
  colorCode: string;
  images: ProductImageForm[];
};

type ProductVariantForm = {
  id: number;
  backendId?: number;
  variantName: string;
  variantDescription: string;
};

type ProductOptionForm = {
  id?: number;
  colorId: number;
  sizeId: number;
  stock: number;
  addPrice: number;
};

type ProductDetailResponse = {
  id?: number;
  productId?: number;
  categoryId?: number;
  parentCategoryId?: number | null;
  category?: {
    id?: number;
    categoryId?: number;
    parentId?: number | null;
    parent?: {
      id?: number;
      categoryId?: number;
    } | null;
  } | null;
  brand?: string;
  name: string;
  description?: string;
  price: number;
  discount?: string;
  usageInfo?: string;
  productType?: string;
  volume?: string;
  skinType?: string;
  personalColor?: string;
  aiApplyEnabled: string;
  status: string;
};

type IdResponse = {
  id: number;
};

type ProductColorInfoResponse = {
  id: number;
  colorName: string;
  colorCode: string;
};

type CategoryResponse = {
  id?: number;
  categoryId?: number;
  parentId?: number | null;
  name: string;
  sortOrder?: number;
  visible?: string;
  parent?: {
    id?: number;
    categoryId?: number;
    name?: string;
  } | null;
};

type ProductColorImageResponse = {
  id: number;
  fileSaved: string;
  filePath: string;
  isMain: string;
  imageType: string;
  sortOrder: number;
};

type ProductColorResponse = {
  id: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  isMain: string;
  sortOrder: number;
  aiApplyEnabled: string;
  visible: string;
  images: ProductColorImageResponse[];
};

type ProductVariantResponse = {
  id: number;
  variantName: string;
  variantDescription?: string;
  visible: string;
  sortOrder: number;
};

type ProductOptionResponse = {
  id: number;
  productColorId: number;
  productVariantId: number;
  stock: number;
  addPrice: number;
  visible: string;
};

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const [searchParams] = useSearchParams();

  const isEdit = Boolean(productId);

  // 관리자 목록에서 전달된 검색/카테고리/page 조건을 그대로 유지한다.
  const returnQueryString = searchParams.toString();
  const productListUrl = returnQueryString
    ? `/admin/products?${returnQueryString}`
    : "/admin/products";

  const [product, setProduct] = useState<ProductForm>({
    brand: "",
    name: "",
    mainCategoryId: "",
    categoryId: "",
    price: "",
    discount: "0",
    description: "",
    usageInfo: "",
    productType: "",
    volume: "",
    skinType: "",
    personalColor: "",
    aiApplyEnabled: "Y",
    status: "ON_SALE",
  });

  const [masterColors, setMasterColors] = useState<ProductColorInfoResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // CATEGORY 테이블에서 대분류/하위분류를 동적으로 계산
  const mainCategories = useMemo(
    () =>
      categories
        .filter((category) => {
          const parentId =
            category.parentId ??
            category.parent?.categoryId ??
            category.parent?.id ??
            null;

          return parentId == null && category.visible !== "N";
        })
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  const subCategories = useMemo(() => {
    if (!product.mainCategoryId) {
      return [];
    }

    const selectedMainId = Number(product.mainCategoryId);

    return categories
      .filter((category) => {
        const parentId =
          category.parentId ??
          category.parent?.categoryId ??
          category.parent?.id ??
          null;

        return parentId === selectedMainId && category.visible !== "N";
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [categories, product.mainCategoryId]);

  const selectedMainCategory = useMemo(() => {
    if (!product.mainCategoryId) {
      return null;
    }

    const selectedMainId = Number(product.mainCategoryId);

    return (
      mainCategories.find(
        (category) =>
          (category.categoryId ?? category.id ?? 0) === selectedMainId
      ) ?? null
    );
  }, [mainCategories, product.mainCategoryId]);

  const hasSubCategories = subCategories.length > 0;

  const [colors, setColors] = useState<ProductColorForm[]>([
    {
      id: Date.now(),
      colorName: "",
      colorCode: "",
      images: [],
    },
  ]);

  const [sizes, setSizes] = useState<ProductVariantForm[]>([
    {
      id: Date.now() + 1,
      variantName: "기본",
      variantDescription: "",
    },
  ]);

  const [options, setOptions] = useState<ProductOptionForm[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 수정 화면에서 삭제한 기존 DB 데이터는 "수정 저장"할 때 실제 반영한다.
  const [deletedSizeIds, setDeletedSizeIds] = useState<number[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [deletedColors, setDeletedColors] = useState<ProductColorForm[]>([]);

  /**
   * 상품 기본정보 변경
   */
  const handleProductChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setProduct((prev) => ({
      ...prev,
      [name]: value,

      // 대분류가 바뀌면 이전 하위 카테고리 선택값은 초기화.
      // 하위 카테고리가 없는 대분류는 저장 시 대분류 ID 자체를 사용한다.
      ...(name === "mainCategoryId"
        ? { categoryId: "" }
        : {}),
    }));
  };

  /**
   * 색상 추가
   */
  const addColor = () => {
    setColors((prev) => [
      ...prev,
      {
        id: Date.now(),
        colorName: "",
        colorCode: "",
        images: [],
      },
    ]);
  };

  /**
   * COLOR 테이블에서 색상 선택
   */
  const changeColor = (id: number, masterColorId: number) => {
    const selected = masterColors.find((color) => color.id === masterColorId);

    setColors((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              masterColorId: selected?.id,
              colorName: selected?.colorName ?? "",
              colorCode: selected?.colorCode ?? "",
            }
          : color
      )
    );
  };

  /**
   * 색상 삭제
   */
  const removeColor = (id: number) => {
    const targetColor = colors.find((color) => color.id === id);

    if (targetColor?.backendId) {
      setDeletedColors((prev) =>
        prev.some((color) => color.backendId === targetColor.backendId)
          ? prev
          : [...prev, targetColor]
      );

      const existingImageIds = targetColor.images
        .filter((image) => !image.file && image.id)
        .map((image) => image.id);

      setDeletedImageIds((prev) =>
        Array.from(new Set([...prev, ...existingImageIds]))
      );
    }

    setColors((prev) =>
      prev.filter((color) => color.id !== id)
    );

    setOptions((prev) =>
      prev.filter((option) => option.colorId !== id)
    );
  };

  /**
   * 이미지 선택
   * THUMBNAIL = 상품 목록/상세 상단 갤러리
   * DETAIL = 상품 상세 설명 영역
   */
  const changeImages = (
    id: number,
    imageType: "THUMBNAIL" | "DETAIL",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    const imageForms: ProductImageForm[] = files.map((file, index) => {
      const dotIndex = file.name.lastIndexOf(".");
      const originalName =
        dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;

      return {
        id: Date.now() + index,
        file,
        fileName: originalName,
        imageType,
      };
    });

    setColors((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              images: [...color.images, ...imageForms],
            }
          : color
      )
    );

    event.target.value = "";
  };

  const removeImage = (colorId: number, imageId: number) => {
    const targetColor = colors.find((color) => color.id === colorId);
    const targetImage = targetColor?.images.find((image) => image.id === imageId);

    // 새로 선택한 로컬 파일은 화면에서만 제거.
    // 기존 DB 이미지는 수정 저장 시 DELETE API를 호출한다.
    if (targetImage && !targetImage.file && targetImage.filePath) {
      setDeletedImageIds((prev) =>
        prev.includes(imageId) ? prev : [...prev, imageId]
      );
    }

    setColors((prev) =>
      prev.map((color) =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.filter((image) => image.id !== imageId),
            }
          : color
      )
    );
  };

  /**
   * 이미지 저장 이름 변경
   */
  const changeImageFileName = (
    colorId: number,
    imageId: number,
    fileName: string
  ) => {
    setColors((prev) =>
      prev.map((color) =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.map((image) =>
                image.id === imageId
                  ? {
                      ...image,
                      fileName,
                    }
                  : image
              ),
            }
          : color
      )
    );
  };

  /**
   * 옵션 추가
   */
  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        id: Date.now(),
        variantName: "",
        variantDescription: "",
      },
    ]);
  };

  /**
   * 옵션 변경
   */
  const changeSize = (
    id: number,
    field: "variantName" | "variantDescription",
    value: string
  ) => {
    setSizes((prev) =>
      prev.map((size) =>
        size.id === id
          ? {
              ...size,
              [field]: value,
            }
          : size
      )
    );
  };

  /**
   * 옵션 삭제
   */
  const removeSize = (id: number) => {
    const targetSize = sizes.find((size) => size.id === id);

    // 기존 DB 옵션는 바로 삭제하지 않고 "수정 저장"할 때 삭제한다.
    if (targetSize?.backendId) {
      setDeletedSizeIds((prev) =>
        prev.includes(targetSize.backendId!)
          ? prev
          : [...prev, targetSize.backendId!]
      );
    }

    setSizes((prev) =>
      prev.filter((size) => size.id !== id)
    );

    setOptions((prev) =>
      prev.filter((option) => option.sizeId !== id)
    );
  };

  /**
   * 색상 × 판매 옵션 생성
   */
  const generateOptions = () => {
    const generated: ProductOptionForm[] = [];

    colors.forEach((color) => {
      sizes.forEach((size) => {
        const oldOption = options.find(
          (option) =>
            option.colorId === color.id &&
            option.sizeId === size.id
        );

        generated.push(
          oldOption ?? {
            colorId: color.id,
            sizeId: size.id,
            stock: 30,
            addPrice: 0,
          }
        );
      });
    });

    setOptions(generated);
  };

  /**
   * 옵션 변경
   */
  const changeOption = (
    colorId: number,
    sizeId: number,
    field: "stock" | "addPrice",
    value: number
  ) => {
    setOptions((prev) =>
      prev.map((option) =>
        option.colorId === colorId &&
        option.sizeId === sizeId
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    );
  };

  const findColorName = (id: number) => {
    return (
      colors.find((color) => color.id === id)?.colorName ||
      "색상 미입력"
    );
  };

  const findSizeName = (id: number) => {
    return (
      sizes.find((size) => size.id === id)?.variantName ||
      "규격 미입력"
    );
  };

  /**
   * COLOR 마스터 목록 조회
   */
  useEffect(() => {
    const loadFormMetadata = async () => {
      try {
        const [categoryResponse, colorResponse] = await Promise.all([
          axiosInstance.get<CategoryResponse[]>("/category/find_all"),
          axiosInstance.get<ProductColorInfoResponse[]>(
            "/product_color_master/find_all"
          ),
        ]);

        setCategories(
          categoryResponse.data.map((category) => ({
            ...category,
            categoryId: category.categoryId ?? category.id ?? 0,
            parentId:
              category.parentId ??
              category.parent?.categoryId ??
              category.parent?.id ??
              null,
          }))
        );

        setMasterColors(colorResponse.data);
      } catch (error) {
        console.error("상품 등록 메타데이터 조회 오류", error);
      }
    };

    loadFormMetadata();
  }, []);

  /**
   * 수정 화면 기존 상품 전체정보 조회
   */
  useEffect(() => {
    if (!isEdit || !productId) {
      return;
    }

    const loadEditProduct = async () => {
      try {
        const [productResponse, colorResponse, sizeResponse, optionResponse] =
          await Promise.all([
            axiosInstance.get<ProductDetailResponse>(`/product/${productId}`),
            axiosInstance.get<ProductColorResponse[]>(`/product_color/product/${productId}`),
            axiosInstance.get<ProductVariantResponse[]>(`/product_variant/product/${productId}`),
            axiosInstance.get<ProductOptionResponse[]>(`/product_option/product/${productId}`),
          ]);

        const data = productResponse.data;

        setProduct({
          brand: data.brand ?? "",
          name: data.name ?? "",
          mainCategoryId: String(
            data.parentCategoryId ??
            data.category?.parentId ??
            data.category?.parent?.categoryId ??
            data.category?.parent?.id ??
            data.categoryId ??
            data.category?.categoryId ??
            data.category?.id ??
            ""
          ),
          categoryId:
            data.parentCategoryId ??
            data.category?.parentId ??
            data.category?.parent?.categoryId ??
            data.category?.parent?.id
              ? String(
                  data.categoryId ??
                  data.category?.categoryId ??
                  data.category?.id ??
                  ""
                )
              : "",
          price: String(data.price ?? ""),
          discount: String(data.discount ?? "0"),
          description: data.description ?? "",
          usageInfo: data.usageInfo ?? "",
          productType: data.productType ?? "",
          volume: data.volume ?? "",
          skinType: data.skinType ?? "",
          personalColor: data.personalColor ?? "",
          aiApplyEnabled: data.aiApplyEnabled ?? "Y",
          status: data.status ?? "ON_SALE",
        });

        const loadedColors: ProductColorForm[] =
          colorResponse.data.map((color) => ({
            id: color.id,
            backendId: color.id,
            masterColorId: color.colorId,
            colorName: color.colorName,
            colorCode: color.colorCode,
            images: (color.images ?? []).map((image) => ({
              id: image.id,
              fileName: image.fileSaved.replace(/\.[^/.]+$/, ""),
              filePath: image.filePath,
              imageType:
                image.imageType === "DETAIL" ? "DETAIL" : "THUMBNAIL",
              isMain: image.isMain,
              sortOrder: image.sortOrder,
            })),
          }));

        setColors(loadedColors);

        // 기존 상품에 등록된 옵션가 하나도 없으면
        // 수정 화면에서 기본 규격을 기본으로 생성한다.
        const loadedSizes: ProductVariantForm[] =
          sizeResponse.data.length > 0
            ? sizeResponse.data.map((size) => ({
                id: size.id,
                backendId: size.id,
                variantName: size.variantName,
                variantDescription: size.variantDescription ?? "",
              }))
            : [
                {
                  id: Date.now() + 101,
                  variantName: "기본",
                  variantDescription: "",
                },
              ];

        setSizes(loadedSizes);

        const loadedOptions: ProductOptionForm[] =
          optionResponse.data.map((option) => ({
            id: option.id,
            colorId: option.productColorId,
            sizeId: option.productVariantId,
            stock: option.stock ?? 0,
            addPrice: option.addPrice ?? 0,
          }));

        // 기존 옵션/옵션이 전혀 없는 예전 상품은
        // 현재 등록된 색상 × 기본 규격 조합을 자동 생성하고 재고를 30으로 시작한다.
        if (
          sizeResponse.data.length === 0 &&
          optionResponse.data.length === 0
        ) {
          const defaultOptions: ProductOptionForm[] = [];

          loadedColors.forEach((color) => {
            loadedSizes.forEach((size) => {
              defaultOptions.push({
                colorId: color.id,
                sizeId: size.id,
                stock: 30,
                addPrice: 0,
              });
            });
          });

          setOptions(defaultOptions);
        } else {
          setOptions(loadedOptions);
        }

        setDeletedSizeIds([]);
        setDeletedImageIds([]);
        setDeletedColors([]);

      } catch (error) {
        console.error("상품 수정 데이터 조회 오류", error);
        alert("기존 상품 정보를 불러오지 못했습니다.");
        navigate(productListUrl);
      }
    };

    loadEditProduct();
  }, [isEdit, productId, navigate]);

  const getImagePreviewUrl = (image: ProductImageForm) => {
    if (image.file) {
      return URL.createObjectURL(image.file);
    }

    if (image.filePath) {
      return `http://localhost:9104${image.filePath}`;
    }

    return "";
  };

  /**
   * 상품 전체 등록
   *
   * 저장 순서
   * 1. PRODUCT
   * 2. PRODUCT_COLOR
   * 3. PRODUCT_COLOR_IMAGE
   * 4. PRODUCT_VARIANT
   * 5. PRODUCT_OPTION
   */
  const submitProduct = async () => {
    if (!product.name.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    if (!product.brand.trim()) {
      alert("브랜드를 입력해주세요.");
      return;
    }

    if (!product.mainCategoryId) {
      alert("대분류를 선택해주세요.");
      return;
    }

    if (hasSubCategories && !product.categoryId) {
      alert("하위 카테고리를 선택해주세요.");
      return;
    }

    if (!product.price) {
      alert("가격을 입력해주세요.");
      return;
    }

    // 등록/수정 공통 유효성 검사
    if (!isEdit) {
      if (colors.some((color) => !color.masterColorId)) {
        alert("색상을 모두 선택해주세요.");
        return;
      }

      if (sizes.some((size) => !size.variantName.trim())) {
        alert("규격명을 모두 입력해주세요.");
        return;
      }

      if (
        colors.some((color) =>
          color.images.some((image) => image.file && !image.fileName.trim())
        )
      ) {
        alert("이미지 저장 이름을 모두 입력해주세요.");
        return;
      }

      if (options.length === 0) {
        alert("판매 옵션 생성 버튼을 눌러주세요.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const effectiveCategoryId = hasSubCategories
        ? Number(product.categoryId)
        : Number(product.mainCategoryId);

      const productData = {
        categoryId: effectiveCategoryId,
        brand: product.brand.trim(),
        name: product.name.trim(),
        description: (product.description ?? "").trim(),
        price: Number(product.price),
        discount: product.discount || "0",
        usageInfo: (product.usageInfo ?? "").trim(),
        productType: (product.productType ?? "").trim() || null,
        volume: (product.volume ?? "").trim() || null,
        skinType: (product.skinType ?? "").trim() || null,
        personalColor: (product.personalColor ?? "").trim() || null,
        aiApplyEnabled: product.aiApplyEnabled,
        status: product.status,
      };

      // 수정 모드: 상품 + 색상 + 이미지 + 옵션 + 옵션/재고 수정
      if (isEdit && productId) {
        // 수정 화면에서도 색상 선택/옵션명을 반드시 확인한다.
        if (colors.some((color) => !color.masterColorId)) {
          throw new Error("선택되지 않은 색상이 있습니다.");
        }

        if (sizes.some((size) => !size.variantName.trim())) {
          throw new Error("규격명을 모두 입력해주세요.");
        }

        if (
          colors.some((color) =>
            color.images.some((image) => image.file && !image.fileName.trim())
          )
        ) {
          throw new Error("이미지 저장 이름을 모두 입력해주세요.");
        }

        // 1. 상품 기본정보 수정
        await axiosInstance.put(`/product/${productId}`, productData);

        // -------------------------------------------------
        // 삭제 처리
        // -------------------------------------------------

        // 삭제한 기존 이미지는 서버 파일 + DB에서 삭제
        for (const deletedImageId of deletedImageIds) {
          await axiosInstance.delete(`/product_color_image/${deletedImageId}`);
        }

        // 삭제한 기존 옵션는 DB에서 삭제
        // 백엔드 ProductVariantService가 연결된 PRODUCT_OPTION을 먼저 정리한다.
        for (const deletedSizeId of deletedSizeIds) {
          await axiosInstance.delete(`/product_variant/${deletedSizeId}`);
        }

        // 삭제한 기존 색상은 물리 삭제 대신 visible=N 처리한다.
        // 이미지/옵션 FK 충돌 없이 상품 화면에서는 더 이상 노출되지 않는다.
        for (const deletedColor of deletedColors) {
          if (!deletedColor.backendId || !deletedColor.masterColorId) {
            continue;
          }

          await axiosInstance.put(
            `/product_color/${deletedColor.backendId}`,
            {
              colorId: deletedColor.masterColorId,
              isMain: "N",
              sortOrder: 9999,
              aiApplyEnabled: product.aiApplyEnabled,
              visible: "N",
            }
          );
        }

        // -------------------------------------------------
        // 2. 상품 색상 수정 / 신규 추가
        // 화면 color.id -> 실제 PRODUCT_COLOR ID 매핑
        // -------------------------------------------------
        const savedEditColorIdMap = new Map<number, number>();

        for (let index = 0; index < colors.length; index += 1) {
          const color = colors[index];

          if (!color.masterColorId) {
            throw new Error(`색상을 선택해주세요: COLOR ${index + 1}`);
          }

          let actualProductColorId: number;

          // 기존 색상은 PUT
          if (color.backendId) {
            const colorResponse = await axiosInstance.put<ProductColorResponse>(
              `/product_color/${color.backendId}`,
              {
                colorId: color.masterColorId,
                isMain: index === 0 ? "Y" : "N",
                sortOrder: index + 1,
                aiApplyEnabled: product.aiApplyEnabled,
                visible: "Y",
              }
            );

            actualProductColorId = colorResponse.data.id ?? color.backendId;
          } else {
            // 수정 화면에서 새로 추가한 색상은 POST
            const colorResponse = await axiosInstance.post<ProductColorResponse>(
              `/product_color/product/${productId}/save`,
              {
                colorId: color.masterColorId,
                isMain: index === 0 ? "Y" : "N",
                sortOrder: index + 1,
                aiApplyEnabled: product.aiApplyEnabled,
                visible: "Y",
              }
            );

            actualProductColorId = colorResponse.data.id;
          }

          if (!actualProductColorId) {
            throw new Error(`${color.colorName} 색상 저장 후 색상번호를 받지 못했습니다.`);
          }

          savedEditColorIdMap.set(color.id, actualProductColorId);

          // -------------------------------------------------
          // 3. 수정 화면에서 새로 추가한 이미지 업로드
          // 기존 이미지는 그대로 유지하고 새 파일만 추가한다.
          // -------------------------------------------------
          const newImages = color.images.filter((image) => image.file);

          const existingThumbnailCount = color.images.filter(
            (image) => !image.file && image.imageType === "THUMBNAIL"
          ).length;
          const existingDetailCount = color.images.filter(
            (image) => !image.file && image.imageType === "DETAIL"
          ).length;

          let newThumbnailIndex = 0;
          let newDetailIndex = 0;

          for (const image of newImages) {
            if (!image.file) continue;

            const isThumbnail = image.imageType === "THUMBNAIL";
            const typeIndex = isThumbnail ? newThumbnailIndex++ : newDetailIndex++;
            const existingCount = isThumbnail
              ? existingThumbnailCount
              : existingDetailCount;

            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("fileName", image.fileName.trim());
            formData.append(
              "isMain",
              isThumbnail && existingThumbnailCount === 0 && typeIndex === 0
                ? "Y"
                : "N"
            );
            formData.append("imageType", image.imageType);
            formData.append("sortOrder", String(existingCount + typeIndex + 1));

            await axiosInstance.post(
              `/product_color_image/product_color/${actualProductColorId}/save`,
              formData
            );
          }
        }

        // -------------------------------------------------
        // 4. 옵션 수정 / 신규 추가
        // 화면 size.id -> 실제 PRODUCT_VARIANT ID 매핑
        // -------------------------------------------------
        const savedEditSizeIdMap = new Map<number, number>();

        for (let index = 0; index < sizes.length; index += 1) {
          const size = sizes[index];

          let actualProductVariantId: number;

          if (size.backendId) {
            const sizeResponse = await axiosInstance.put<ProductVariantResponse>(
              `/product_variant/${size.backendId}`,
              {
                variantName: size.variantName.trim(),
                variantDescription: size.variantDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductVariantId = sizeResponse.data.id ?? size.backendId;
          } else {
            const sizeResponse = await axiosInstance.post<ProductVariantResponse>(
              `/product_variant/product/${productId}/save`,
              {
                variantName: size.variantName.trim(),
                variantDescription: size.variantDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductVariantId = sizeResponse.data.id;
          }

          if (!actualProductVariantId) {
            throw new Error(`${size.variantName} 규격 저장 후 규격번호를 받지 못했습니다.`);
          }

          savedEditSizeIdMap.set(size.id, actualProductVariantId);
        }

        // -------------------------------------------------
        // 5. 옵션 수정 / 신규 추가
        // 임시 color/size ID를 실제 DB ID로 치환한다.
        // -------------------------------------------------
        for (const option of options) {
          const actualProductColorId =
            savedEditColorIdMap.get(option.colorId) ?? option.colorId;
          const actualProductVariantId =
            savedEditSizeIdMap.get(option.sizeId) ?? option.sizeId;

          if (option.id) {
            await axiosInstance.put(
              `/product_option/${option.id}`,
              {
                productColorId: actualProductColorId,
                productVariantId: actualProductVariantId,
                addPrice: option.addPrice,
                stock: option.stock,
                visible: "Y",
              }
            );
          } else {
            await axiosInstance.post(
              `/product_option/product/${productId}/save`,
              {
                productColorId: actualProductColorId,
                productVariantId: actualProductVariantId,
                addPrice: option.addPrice,
                stock: option.stock,
                visible: "Y",
              }
            );
          }
        }

        // -------------------------------------------------
        // 6. 저장 후 서버에서 다시 조회해서 실제 반영 여부 확인
        // 조회까지 성공해야 '수정 완료'를 표시한다.
        // -------------------------------------------------
        const [verifyProduct, verifyColors, verifySizes, verifyOptions] =
          await Promise.all([
            axiosInstance.get<ProductDetailResponse>(`/product/${productId}`),
            axiosInstance.get<ProductColorResponse[]>(`/product_color/product/${productId}`),
            axiosInstance.get<ProductVariantResponse[]>(`/product_variant/product/${productId}`),
            axiosInstance.get<ProductOptionResponse[]>(`/product_option/product/${productId}`),
          ]);

        if (
          verifyProduct.data.name !== product.name.trim() ||
          verifyProduct.data.brand !== product.brand.trim()
        ) {
          throw new Error("상품 기본정보가 서버에 반영되지 않았습니다.");
        }

        const verifiedVisibleColors = verifyColors.data.filter(
          (color) => color.visible === "Y"
        );

        if (verifiedVisibleColors.length !== colors.length) {
          throw new Error("상품 색상 추가/삭제가 서버에 정확히 반영되지 않았습니다.");
        }

        const verifiedVisibleSizes = verifySizes.data.filter(
          (size) => size.visible === "Y"
        );

        const expectedSizeNames = sizes
          .map((size) => size.variantName.trim())
          .sort()
          .join("|");

        const verifiedSizeNames = verifiedVisibleSizes
          .map((size) => size.variantName.trim())
          .sort()
          .join("|");

        if (expectedSizeNames !== verifiedSizeNames) {
          throw new Error("상품 옵션 추가/수정/삭제가 서버에 정확히 반영되지 않았습니다.");
        }

        if (options.length > 0 && verifyOptions.data.length < options.length) {
          throw new Error("상품 옵션/재고 정보가 서버에 모두 반영되지 않았습니다.");
        }

        alert("상품 수정이 완료되었습니다.");
        navigate(productListUrl);
        return;
      }

      // -------------------------------------------------
      // 0. 선택한 COLOR 마스터 확인
      // -------------------------------------------------
      for (const color of colors) {
        if (!color.masterColorId) {
          throw new Error("선택되지 않은 색상이 있습니다.");
        }
      }

      // -------------------------------------------------
      // 1. 상품 기본정보 저장
      // ProductResponseDto의 PK 필드명은 id
      // -------------------------------------------------
      const productResponse = await axiosInstance.post<IdResponse>(
        "/product/save",
        productData
      );

      const savedProductId = productResponse.data.id;

      if (!savedProductId) {
        throw new Error("상품 등록 후 상품번호를 받지 못했습니다.");
      }

      // 화면에서 사용하는 임시 ID -> DB에 저장된 실제 ID
      const savedColorIdMap = new Map<number, number>();
      const savedSizeIdMap = new Map<number, number>();

      // -------------------------------------------------
      // 2. 상품 색상 저장
      // -------------------------------------------------
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
        const color = colors[colorIndex];

        if (!color.masterColorId) {
          throw new Error(`색상을 선택해주세요: COLOR ${colorIndex + 1}`);
        }

        const colorResponse = await axiosInstance.post<IdResponse>(
          `/product_color/product/${savedProductId}/save`,
          {
            colorId: color.masterColorId,
            isMain: colorIndex === 0 ? "Y" : "N",
            sortOrder: colorIndex + 1,
            aiApplyEnabled: product.aiApplyEnabled,
            visible: "Y",
          }
        );

        const savedProductColorId = colorResponse.data.id;

        if (!savedProductColorId) {
          throw new Error(
            `${color.colorName} 색상 등록 후 색상번호를 받지 못했습니다.`
          );
        }

        savedColorIdMap.set(color.id, savedProductColorId);

        // -------------------------------------------------
        // 3. 색상별 이미지 저장
        // THUMBNAIL: 상품 목록 + 상세 상단 갤러리
        // DETAIL: 상품 상세 설명 영역
        // -------------------------------------------------
        const thumbnailImages = color.images.filter(
          (image) => image.imageType === "THUMBNAIL"
        );
        const detailImages = color.images.filter(
          (image) => image.imageType === "DETAIL"
        );

        const uploadImages = async (
          images: ProductImageForm[],
          imageType: "THUMBNAIL" | "DETAIL"
        ) => {
          for (let imageIndex = 0; imageIndex < images.length; imageIndex += 1) {
            const image = images[imageIndex];
            if (!image.file) continue;

            const formData = new FormData();
            formData.append("file", image.file);
            formData.append("fileName", image.fileName.trim());
            formData.append(
              "isMain",
              imageType === "THUMBNAIL" && imageIndex === 0 ? "Y" : "N"
            );
            formData.append("imageType", imageType);
            formData.append("sortOrder", String(imageIndex + 1));

            await axiosInstance.post(
              `/product_color_image/product_color/${savedProductColorId}/save`,
              formData
            );
          }
        };

        await uploadImages(thumbnailImages, "THUMBNAIL");
        await uploadImages(detailImages, "DETAIL");
      }

      // -------------------------------------------------
      // 4. 상품 옵션 저장
      // -------------------------------------------------
      for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
        const size = sizes[sizeIndex];

        const sizeResponse = await axiosInstance.post<IdResponse>(
          `/product_variant/product/${savedProductId}/save`,
          {
            variantName: size.variantName.trim(),
            variantDescription: size.variantDescription.trim(),
            visible: "Y",
            sortOrder: sizeIndex + 1,
          }
        );

        const savedProductVariantId = sizeResponse.data.id;

        if (!savedProductVariantId) {
          throw new Error(
            `${size.variantName} 규격 등록 후 규격번호를 받지 못했습니다.`
          );
        }

        savedSizeIdMap.set(size.id, savedProductVariantId);
      }

      // -------------------------------------------------
      // 5. 옵션 / 재고 저장
      // -------------------------------------------------
      for (const option of options) {
        const savedProductColorId = savedColorIdMap.get(option.colorId);
        const savedProductVariantId = savedSizeIdMap.get(option.sizeId);

        if (!savedProductColorId || !savedProductVariantId) {
          throw new Error("옵션 저장에 필요한 색상/옵션 번호가 없습니다.");
        }

        await axiosInstance.post(
          `/product_option/product/${savedProductId}/save`,
          {
            productColorId: savedProductColorId,
            productVariantId: savedProductVariantId,
            addPrice: option.addPrice,
            stock: option.stock,
            visible: "Y",
          }
        );
      }

      alert(`상품 등록이 완료되었습니다. 상품번호: ${savedProductId}`);
      navigate(productListUrl);
    } catch (error) {
      console.error("상품 등록 오류", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        console.error("Spring 응답 오류", (error as any).response?.data);
      }

      alert(
        error instanceof Error
          ? error.message
          : "상품 등록 중 오류가 발생했습니다. 콘솔과 Spring 로그를 확인해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleProductCsvValue = (
    field: "skinType" | "personalColor",
    value: string
  ) => {
    setProduct((prev) => {
      const currentValues = (prev[field] ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [field]: nextValues.join(","),
      };
    });
  };

  const hasProductCsvValue = (
    field: "skinType" | "personalColor",
    value: string
  ) =>
    (product[field] ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .includes(value);

  return (
    <main className="admin-product-form-page admin-product-form-v2">
      <div className="admin-form-header admin-form-header-v2">
        <div>
          <p>PRODUCT MANAGEMENT</p>
          <h1>{isEdit ? "상품 수정" : "새 상품 등록"}</h1>
          <span>
            필수 정보부터 옵션·재고까지 순서대로 입력하면 됩니다.
          </span>
        </div>

        <div className="admin-form-header-actions">
          <span className="admin-form-mode-badge">
            {isEdit ? "EDIT MODE" : "NEW PRODUCT"}
          </span>
          <button
            type="button"
            className="admin-form-back"
            onClick={() => navigate(productListUrl)}
          >
            목록으로
          </button>
        </div>
      </div>

      <div className="admin-product-workspace">
        <aside className="admin-product-stepper">
          <div className="admin-stepper-head">
            <span>REGISTRATION FLOW</span>
            <strong>등록 순서</strong>
          </div>

          <nav className="admin-stepper-nav">
            <a
              href="#admin-step-basic"
              className={product.name && product.brand ? "is-complete" : ""}
            >
              <span>01</span>
              <div>
                <strong>기본 정보</strong>
                <small>상품명 · 브랜드 · 분류</small>
              </div>
            </a>

            <a
              href="#admin-step-beauty"
              className={product.productType ? "is-complete" : ""}
            >
              <span>02</span>
              <div>
                <strong>뷰티 정보</strong>
                <small>타입 · 피부 · 퍼스널컬러</small>
              </div>
            </a>

            <a
              href="#admin-step-color"
              className={
                colors.length > 0 && colors.every((color) => color.masterColorId)
                  ? "is-complete"
                  : ""
              }
            >
              <span>03</span>
              <div>
                <strong>색상 & 이미지</strong>
                <small>컬러 · 썸네일 · 상세 이미지</small>
              </div>
            </a>

            <a
              href="#admin-step-variant"
              className={
                sizes.length > 0 && sizes.every((size) => size.variantName.trim())
                  ? "is-complete"
                  : ""
              }
            >
              <span>04</span>
              <div>
                <strong>규격</strong>
                <small>용량 · 호수 · 구성</small>
              </div>
            </a>

            <a
              href="#admin-step-stock"
              className={options.length > 0 ? "is-complete" : ""}
            >
              <span>05</span>
              <div>
                <strong>옵션 & 재고</strong>
                <small>조합 자동 생성 · 재고 입력</small>
              </div>
            </a>
          </nav>

          <div className="admin-stepper-summary">
            <div>
              <span>COLOR</span>
              <strong>{colors.length}</strong>
            </div>
            <div>
              <span>VARIANT</span>
              <strong>{sizes.length}</strong>
            </div>
            <div>
              <span>OPTION</span>
              <strong>{options.length}</strong>
            </div>
          </div>

          <div className="admin-stepper-tip">
            <strong>빠른 등록 TIP</strong>
            <p>
              색상과 규격을 먼저 만든 뒤 마지막 단계에서 조합을 한 번에
              생성하면 재고 입력이 훨씬 빨라요.
            </p>
          </div>
        </aside>

        <div className="admin-product-editor">
          <section
            id="admin-step-basic"
            className="admin-form-section admin-editor-section"
          >
            <div className="admin-form-section-title admin-editor-section-title">
              <span>01</span>
              <div>
                <p className="admin-section-kicker">CORE INFORMATION</p>
                <h2>기본 정보</h2>
                <p>판매에 꼭 필요한 정보부터 먼저 입력합니다.</p>
              </div>
              <span className="admin-required-pill">필수</span>
            </div>

            <div className="admin-editor-block">
              <div className="admin-editor-block-head">
                <strong>상품 기본</strong>
                <span>고객에게 가장 먼저 보이는 정보</span>
              </div>

              <div className="admin-form-grid admin-form-grid-v2">
                <div className="admin-form-field full admin-field-featured">
                  <label>상품명 *</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleProductChange}
                    placeholder="예: Dewy Lip Tint"
                  />
                </div>

                <div className="admin-form-field">
                  <label>브랜드 *</label>
                  <input
                    type="text"
                    name="brand"
                    value={product.brand}
                    onChange={handleProductChange}
                    placeholder="예: GODDESS"
                  />
                </div>

                <div className="admin-form-field">
                  <label>상품 유형</label>
                  <select
                    name="productType"
                    value={product.productType}
                    onChange={handleProductChange}
                  >
                    <option value="">상품 유형 선택</option>
                    <option value="BASE">베이스 / 파운데이션</option>
                    <option value="LIP">립</option>
                    <option value="EYE">아이</option>
                    <option value="BLUSH">치크 / 블러셔</option>
                    <option value="BROW">브로우</option>
                    <option value="SKINCARE">스킨케어</option>
                    <option value="HAIR">헤어</option>
                    <option value="BODY">바디</option>
                    <option value="FRAGRANCE">향수</option>
                    <option value="TOOL">뷰티소품</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-editor-block">
              <div className="admin-editor-block-head">
                <strong>분류 & 판매</strong>
                <span>카테고리, 가격, 판매 상태 설정</span>
              </div>

              <div className="admin-form-grid admin-form-grid-v2 admin-grid-3">
                <div className="admin-form-field">
                  <label>대분류 *</label>
                  <select
                    name="mainCategoryId"
                    value={product.mainCategoryId}
                    onChange={handleProductChange}
                  >
                    <option value="">대분류 선택</option>
                    {mainCategories.map((category) => {
                      const categoryId = category.categoryId ?? category.id ?? 0;
                      return (
                        <option
                          key={`main-category-${categoryId}`}
                          value={String(categoryId)}
                        >
                          {category.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {hasSubCategories ? (
                  <div className="admin-form-field">
                    <label>하위 카테고리 *</label>
                    <select
                      name="categoryId"
                      value={product.categoryId}
                      onChange={handleProductChange}
                      disabled={!product.mainCategoryId}
                    >
                      <option value="">
                        {product.mainCategoryId
                          ? "카테고리 선택"
                          : "대분류를 먼저 선택"}
                      </option>
                      {subCategories.map((category) => {
                        const categoryId = category.categoryId ?? category.id ?? 0;
                        return (
                          <option
                            key={`sub-category-${categoryId}`}
                            value={String(categoryId)}
                          >
                            {category.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : product.mainCategoryId ? (
                  <div className="admin-form-field">
                    <label>카테고리</label>
                    <input
                      type="text"
                      value={selectedMainCategory?.name ?? ""}
                      readOnly
                    />
                    <p>하위 카테고리가 없어 대분류로 등록됩니다.</p>
                  </div>
                ) : (
                  <div className="admin-form-field">
                    <label>하위 카테고리</label>
                    <input
                      type="text"
                      value=""
                      placeholder="대분류를 먼저 선택"
                      readOnly
                    />
                  </div>
                )}

                <div className="admin-form-field">
                  <label>판매 상태</label>
                  <select
                    name="status"
                    value={product.status}
                    onChange={handleProductChange}
                  >
                    <option value="ON_SALE">판매중</option>
                    <option value="SOLD_OUT">품절</option>
                    <option value="STOPPED">판매중지</option>
                    <option value="HIDDEN">숨김</option>
                  </select>
                </div>

                <div className="admin-form-field">
                  <label>판매 가격 *</label>
                  <div className="admin-input-unit">
                    <input
                      type="number"
                      name="price"
                      min="0"
                      value={product.price}
                      onChange={handleProductChange}
                      placeholder="0"
                    />
                    <span className="admin-input-unit-text">원</span>
                  </div>
                </div>

                <div className="admin-form-field">
                  <label>할인율</label>
                  <div className="admin-input-unit">
                    <input
                      type="number"
                      name="discount"
                      min="0"
                      max="100"
                      step="1"
                      value={product.discount}
                      onChange={handleProductChange}
                      placeholder="0"
                    />
                    <span className="admin-input-unit-text">%</span>
                  </div>
                  {product.price && Number(product.discount) > 0 && (
                    <p className="admin-discount-preview">
                      최종 판매가{" "}
                      <strong>
                        {Math.round(
                          Number(product.price) *
                            (1 - Number(product.discount) / 100)
                        ).toLocaleString()}
                        원
                      </strong>
                    </p>
                  )}
                </div>

                <div className="admin-form-field">
                  <label>용량 / 중량</label>
                  <input
                    type="text"
                    name="volume"
                    value={product.volume}
                    onChange={handleProductChange}
                    placeholder="예: 4.5g, 30ml"
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="admin-step-beauty"
            className="admin-form-section admin-editor-section"
          >
            <div className="admin-form-section-title admin-editor-section-title">
              <span>02</span>
              <div>
                <p className="admin-section-kicker">BEAUTY TARGETING</p>
                <h2>뷰티 추천 정보</h2>
                <p>필터와 AI BEAUTY 추천에 사용할 값을 빠르게 선택합니다.</p>
              </div>
            </div>

            <div className="admin-editor-block">
              <div className="admin-form-grid admin-form-grid-v2">
                <div className="admin-form-field full">
                  <label>추천 피부 타입</label>
                  <div className="admin-choice-chips">
                    {["건성", "지성", "복합성", "중성", "민감성"].map(
                      (skinType) => (
                        <button
                          key={skinType}
                          type="button"
                          className={
                            hasProductCsvValue("skinType", skinType)
                              ? "is-selected"
                              : ""
                          }
                          onClick={() =>
                            toggleProductCsvValue("skinType", skinType)
                          }
                        >
                          {skinType}
                        </button>
                      )
                    )}
                  </div>
                  <p>여러 개 선택할 수 있습니다.</p>
                </div>

                <div className="admin-form-field full">
                  <label>추천 퍼스널컬러</label>
                  <div className="admin-choice-chips">
                    {["봄웜", "여름쿨", "가을웜", "겨울쿨"].map(
                      (personalColor) => (
                        <button
                          key={personalColor}
                          type="button"
                          className={
                            hasProductCsvValue("personalColor", personalColor)
                              ? "is-selected"
                              : ""
                          }
                          onClick={() =>
                            toggleProductCsvValue(
                              "personalColor",
                              personalColor
                            )
                          }
                        >
                          {personalColor}
                        </button>
                      )
                    )}
                  </div>
                  <p>상품과 잘 맞는 톤만 골라주세요.</p>
                </div>

                <div className="admin-form-field full">
                  <label>AI BEAUTY 적용</label>
                  <div className="admin-segmented-control">
                    <button
                      type="button"
                      className={
                        product.aiApplyEnabled === "Y" ? "is-selected" : ""
                      }
                      onClick={() =>
                        setProduct((prev) => ({
                          ...prev,
                          aiApplyEnabled: "Y",
                        }))
                      }
                    >
                      AI 체험 사용
                    </button>
                    <button
                      type="button"
                      className={
                        product.aiApplyEnabled === "N" ? "is-selected" : ""
                      }
                      onClick={() =>
                        setProduct((prev) => ({
                          ...prev,
                          aiApplyEnabled: "N",
                        }))
                      }
                    >
                      사용 안 함
                    </button>
                  </div>
                </div>

                <div className="admin-form-field full">
                  <label>사용 방법</label>
                  <textarea
                    name="usageInfo"
                    value={product.usageInfo}
                    onChange={handleProductChange}
                    placeholder="예: 적당량을 덜어 입술 안쪽부터 부드럽게 펴 발라주세요."
                    rows={3}
                  />
                </div>

                <div className="admin-form-field full">
                  <label>상품 설명</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleProductChange}
                    placeholder="상품의 특징과 장점을 입력해주세요."
                    rows={5}
                  />
                </div>
              </div>
            </div>
          </section>

          <section
            id="admin-step-color"
            className="admin-form-section admin-editor-section"
          >
            <div className="admin-form-section-title admin-editor-section-title">
              <span>03</span>
              <div>
                <p className="admin-section-kicker">COLOR & MEDIA</p>
                <h2>색상 및 이미지</h2>
                <p>색상을 추가하고 각 컬러의 이미지를 바로 연결합니다.</p>
              </div>
              <button
                type="button"
                className="admin-pink-outline-button"
                onClick={addColor}
              >
                + 색상 추가
              </button>
            </div>

            <div className="admin-color-list admin-color-list-v2">
              {colors.map((color, index) => {
                const thumbnailImages = color.images.filter(
                  (image) => image.imageType === "THUMBNAIL"
                );
                const detailImages = color.images.filter(
                  (image) => image.imageType === "DETAIL"
                );

                return (
                  <div className="admin-color-card admin-color-card-v2" key={color.id}>
                    <div className="admin-color-card-header">
                      <div className="admin-color-title-wrap">
                        <span
                          className="admin-color-swatch-large"
                          style={{
                            backgroundColor: color.colorCode || "#f4f2f1",
                          }}
                        />
                        <div>
                          <small>
                            COLOR {String(index + 1).padStart(2, "0")}
                            {index === 0 ? " · 대표" : ""}
                          </small>
                          <strong>{color.colorName || "색상을 선택해주세요"}</strong>
                        </div>
                      </div>

                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColor(color.id)}
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    <div className="admin-color-fields">
                      <div className="admin-form-field full">
                        <label>색상 선택 *</label>
                        <select
                          value={color.masterColorId ?? ""}
                          onChange={(event) =>
                            changeColor(color.id, Number(event.target.value))
                          }
                        >
                          <option value="">등록된 컬러에서 선택</option>
                          {masterColors.map((masterColor) => (
                            <option key={masterColor.id} value={masterColor.id}>
                              {masterColor.colorName} ({masterColor.colorCode})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="admin-media-columns">
                      <div className="admin-image-upload admin-image-upload-v2">
                        <div className="admin-upload-head">
                          <div>
                            <strong>상품 이미지</strong>
                            <span>목록 + 상세 상단 갤러리</span>
                          </div>
                          <label className="admin-file-button">
                            이미지 선택
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) =>
                                changeImages(color.id, "THUMBNAIL", event)
                              }
                            />
                          </label>
                        </div>

                        {thumbnailImages.length === 0 ? (
                          <div className="admin-upload-empty">
                            대표 상품 이미지를 추가해주세요.
                          </div>
                        ) : (
                          <div className="admin-image-preview-list">
                            {thumbnailImages.map((image, imageIndex) => (
                              <div className="admin-image-preview" key={image.id}>
                                <img src={getImagePreviewUrl(image)} alt="" />
                                {imageIndex === 0 && <span>대표</span>}
                                <input
                                  type="text"
                                  value={image.fileName}
                                  onChange={(event) =>
                                    changeImageFileName(
                                      color.id,
                                      image.id,
                                      event.target.value
                                    )
                                  }
                                  placeholder="저장 파일명"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(color.id, image.id)}
                                >
                                  {image.file ? "제거" : "삭제"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="admin-image-upload admin-image-upload-v2">
                        <div className="admin-upload-head">
                          <div>
                            <strong>상세 설명 이미지</strong>
                            <span>PRODUCT INFORMATION 영역</span>
                          </div>
                          <label className="admin-file-button">
                            이미지 선택
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(event) =>
                                changeImages(color.id, "DETAIL", event)
                              }
                            />
                          </label>
                        </div>

                        {detailImages.length === 0 ? (
                          <div className="admin-upload-empty">
                            필요할 때만 상세 이미지를 추가하세요.
                          </div>
                        ) : (
                          <div className="admin-image-preview-list">
                            {detailImages.map((image) => (
                              <div className="admin-image-preview" key={image.id}>
                                <img src={getImagePreviewUrl(image)} alt="" />
                                <input
                                  type="text"
                                  value={image.fileName}
                                  onChange={(event) =>
                                    changeImageFileName(
                                      color.id,
                                      image.id,
                                      event.target.value
                                    )
                                  }
                                  placeholder="저장 파일명"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(color.id, image.id)}
                                >
                                  {image.file ? "제거" : "삭제"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section
            id="admin-step-variant"
            className="admin-form-section admin-editor-section"
          >
            <div className="admin-form-section-title admin-editor-section-title">
              <span>04</span>
              <div>
                <p className="admin-section-kicker">VARIANTS</p>
                <h2>상품 규격</h2>
                <p>용량, 호수, 구성처럼 실제 판매 단위를 등록합니다.</p>
              </div>
              <button
                type="button"
                className="admin-pink-outline-button"
                onClick={addSize}
              >
                + 규격 추가
              </button>
            </div>

            <div className="admin-size-list admin-size-list-v2">
              <div className="admin-variant-table-head">
                <span>규격명</span>
                <span>설명</span>
                <span></span>
              </div>
              {sizes.map((size) => (
                <div className="admin-size-row admin-size-row-v2" key={size.id}>
                  <input
                    type="text"
                    value={size.variantName}
                    onChange={(event) =>
                      changeSize(size.id, "variantName", event.target.value)
                    }
                    placeholder="예: 기본, 30ml, 21호"
                  />
                  <input
                    type="text"
                    value={size.variantDescription}
                    onChange={(event) =>
                      changeSize(
                        size.id,
                        "variantDescription",
                        event.target.value
                      )
                    }
                    placeholder="규격 설명 (선택)"
                  />
                  <button type="button" onClick={() => removeSize(size.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section
            id="admin-step-stock"
            className="admin-form-section admin-editor-section"
          >
            <div className="admin-form-section-title admin-editor-section-title">
              <span>05</span>
              <div>
                <p className="admin-section-kicker">STOCK MATRIX</p>
                <h2>판매 옵션 및 재고</h2>
                <p>색상 × 규격 조합을 자동으로 만든 뒤 재고만 입력하세요.</p>
              </div>
              <button
                type="button"
                className="admin-option-generate-button"
                onClick={generateOptions}
              >
                색상 × 규격 옵션 자동 생성
              </button>
            </div>

            {options.length === 0 ? (
              <div className="admin-option-empty admin-option-empty-v2">
                <span>OPTION MATRIX</span>
                <strong>아직 판매 옵션이 없어요.</strong>
                <p>
                  위에서 색상과 규격을 입력한 다음
                  <b> 옵션 자동 생성</b> 버튼을 눌러주세요.
                </p>
              </div>
            ) : (
              <div className="admin-option-table-wrap admin-option-table-wrap-v2">
                <div className="admin-option-count-row">
                  <span>생성된 옵션</span>
                  <strong>{options.length}개</strong>
                </div>
                <table className="admin-option-table">
                  <thead>
                    <tr>
                      <th>색상</th>
                      <th>규격</th>
                      <th>재고</th>
                      <th>추가 금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {options.map((option) => (
                      <tr key={`${option.colorId}-${option.sizeId}`}>
                        <td>{findColorName(option.colorId)}</td>
                        <td>{findSizeName(option.sizeId)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={option.stock}
                            onChange={(event) =>
                              changeOption(
                                option.colorId,
                                option.sizeId,
                                "stock",
                                Number(event.target.value)
                              )
                            }
                          />
                        </td>
                        <td>
                          <div className="admin-option-price-input">
                            <input
                              type="number"
                              min="0"
                              value={option.addPrice}
                              onChange={(event) =>
                                changeOption(
                                  option.colorId,
                                  option.sizeId,
                                  "addPrice",
                                  Number(event.target.value)
                                )
                              }
                            />
                            <span>원</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="admin-form-actions admin-form-actions-v2">
        <div className="admin-save-guide">
          <span />
          <p>
            {product.name.trim()
              ? `${product.name} 저장 준비 중`
              : "상품명을 입력하면 등록을 시작할 수 있어요."}
          </p>
        </div>

        <div>
          <button
            type="button"
            className="admin-form-cancel"
            onClick={() => navigate(productListUrl)}
          >
            취소
          </button>
          <button
            type="button"
            className="admin-form-submit"
            onClick={submitProduct}
            disabled={submitting}
          >
            {submitting
              ? "저장 중..."
              : isEdit
                ? "변경사항 저장"
                : "상품 등록 완료"}
          </button>
        </div>
      </div>
    </main>
  );
};

export default AdminProductForm;
