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
  material: string;
  washingInfo: string;
  fittingEnabled: string;
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

type ProductSizeForm = {
  id: number;
  backendId?: number;
  sizeName: string;
  sizeDescription: string;
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
  material?: string;
  washing?: string;
  fittingEnabled: string;
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
  fittingEnabled: string;
  visible: string;
  images: ProductColorImageResponse[];
};

type ProductSizeResponse = {
  id: number;
  sizeName: string;
  sizeDescription?: string;
  visible: string;
  sortOrder: number;
};

type ProductOptionResponse = {
  id: number;
  productColorId: number;
  productSizeId: number;
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
    material: "",
    washingInfo: "",
    fittingEnabled: "Y",
    status: "판매중",
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

  const [sizes, setSizes] = useState<ProductSizeForm[]>([
    {
      id: Date.now() + 1,
      sizeName: "S",
      sizeDescription: "",
    },
    {
      id: Date.now() + 2,
      sizeName: "M",
      sizeDescription: "",
    },
    {
      id: Date.now() + 3,
      sizeName: "L",
      sizeDescription: "",
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
   * 사이즈 추가
   */
  const addSize = () => {
    setSizes((prev) => [
      ...prev,
      {
        id: Date.now(),
        sizeName: "",
        sizeDescription: "",
      },
    ]);
  };

  /**
   * 사이즈 변경
   */
  const changeSize = (
    id: number,
    field: "sizeName" | "sizeDescription",
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
   * 사이즈 삭제
   */
  const removeSize = (id: number) => {
    const targetSize = sizes.find((size) => size.id === id);

    // 기존 DB 사이즈는 바로 삭제하지 않고 "수정 저장"할 때 삭제한다.
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
   * 색상 × 사이즈 조합 생성
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
      sizes.find((size) => size.id === id)?.sizeName ||
      "사이즈 미입력"
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
            "/product_color_info/find_all"
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
            axiosInstance.get<ProductSizeResponse[]>(`/product_size/product/${productId}`),
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
          discount: data.discount ?? "0",
          description: data.description ?? "",
          material: data.material ?? "",
          washingInfo: data.washing ?? "",
          fittingEnabled: data.fittingEnabled ?? "Y",
          status: data.status ?? "판매중",
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

        // 기존 상품에 등록된 사이즈가 하나도 없으면
        // 수정 화면에서 S / M / L을 기본으로 생성한다.
        const loadedSizes: ProductSizeForm[] =
          sizeResponse.data.length > 0
            ? sizeResponse.data.map((size) => ({
                id: size.id,
                backendId: size.id,
                sizeName: size.sizeName,
                sizeDescription: size.sizeDescription ?? "",
              }))
            : [
                {
                  id: Date.now() + 101,
                  sizeName: "S",
                  sizeDescription: "",
                },
                {
                  id: Date.now() + 102,
                  sizeName: "M",
                  sizeDescription: "",
                },
                {
                  id: Date.now() + 103,
                  sizeName: "L",
                  sizeDescription: "",
                },
              ];

        setSizes(loadedSizes);

        const loadedOptions: ProductOptionForm[] =
          optionResponse.data.map((option) => ({
            id: option.id,
            colorId: option.productColorId,
            sizeId: option.productSizeId,
            stock: option.stock ?? 0,
            addPrice: option.addPrice ?? 0,
          }));

        // 기존 사이즈/옵션이 전혀 없는 예전 상품은
        // 현재 등록된 색상 × S/M/L 조합을 자동 생성하고 재고를 30으로 시작한다.
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
      return `http://localhost:9103${image.filePath}`;
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
   * 4. PRODUCT_SIZE
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

      if (sizes.some((size) => !size.sizeName.trim())) {
        alert("사이즈명을 모두 입력해주세요.");
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
        alert("옵션 조합 생성 버튼을 눌러주세요.");
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
        description: product.description.trim(),
        price: Number(product.price),
        discount: product.discount || "0",
        material: product.material.trim(),
        washing: product.washingInfo.trim(),
        fittingEnabled: product.fittingEnabled,
        status: product.status,
      };

      // 수정 모드: 상품 + 색상 + 이미지 + 사이즈 + 옵션/재고 수정
      if (isEdit && productId) {
        // 수정 화면에서도 색상 선택/사이즈명을 반드시 확인한다.
        if (colors.some((color) => !color.masterColorId)) {
          throw new Error("선택되지 않은 색상이 있습니다.");
        }

        if (sizes.some((size) => !size.sizeName.trim())) {
          throw new Error("사이즈명을 모두 입력해주세요.");
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

        // 삭제한 기존 사이즈는 DB에서 삭제
        // 백엔드 ProductSizeService가 연결된 PRODUCT_OPTION을 먼저 정리한다.
        for (const deletedSizeId of deletedSizeIds) {
          await axiosInstance.delete(`/product_size/${deletedSizeId}`);
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
              fittingEnabled: product.fittingEnabled,
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
                fittingEnabled: product.fittingEnabled,
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
                fittingEnabled: product.fittingEnabled,
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
        // 4. 사이즈 수정 / 신규 추가
        // 화면 size.id -> 실제 PRODUCT_SIZE ID 매핑
        // -------------------------------------------------
        const savedEditSizeIdMap = new Map<number, number>();

        for (let index = 0; index < sizes.length; index += 1) {
          const size = sizes[index];

          let actualProductSizeId: number;

          if (size.backendId) {
            const sizeResponse = await axiosInstance.put<ProductSizeResponse>(
              `/product_size/${size.backendId}`,
              {
                sizeName: size.sizeName.trim(),
                sizeDescription: size.sizeDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductSizeId = sizeResponse.data.id ?? size.backendId;
          } else {
            const sizeResponse = await axiosInstance.post<ProductSizeResponse>(
              `/product_size/product/${productId}/save`,
              {
                sizeName: size.sizeName.trim(),
                sizeDescription: size.sizeDescription.trim(),
                visible: "Y",
                sortOrder: index + 1,
              }
            );

            actualProductSizeId = sizeResponse.data.id;
          }

          if (!actualProductSizeId) {
            throw new Error(`${size.sizeName} 사이즈 저장 후 사이즈번호를 받지 못했습니다.`);
          }

          savedEditSizeIdMap.set(size.id, actualProductSizeId);
        }

        // -------------------------------------------------
        // 5. 옵션 수정 / 신규 추가
        // 임시 color/size ID를 실제 DB ID로 치환한다.
        // -------------------------------------------------
        for (const option of options) {
          const actualProductColorId =
            savedEditColorIdMap.get(option.colorId) ?? option.colorId;
          const actualProductSizeId =
            savedEditSizeIdMap.get(option.sizeId) ?? option.sizeId;

          if (option.id) {
            await axiosInstance.put(
              `/product_option/${option.id}`,
              {
                productColorId: actualProductColorId,
                productSizeId: actualProductSizeId,
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
                productSizeId: actualProductSizeId,
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
            axiosInstance.get<ProductSizeResponse[]>(`/product_size/product/${productId}`),
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
          .map((size) => size.sizeName.trim())
          .sort()
          .join("|");

        const verifiedSizeNames = verifiedVisibleSizes
          .map((size) => size.sizeName.trim())
          .sort()
          .join("|");

        if (expectedSizeNames !== verifiedSizeNames) {
          throw new Error("상품 사이즈 추가/수정/삭제가 서버에 정확히 반영되지 않았습니다.");
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
            fittingEnabled: product.fittingEnabled,
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
      // 4. 상품 사이즈 저장
      // -------------------------------------------------
      for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
        const size = sizes[sizeIndex];

        const sizeResponse = await axiosInstance.post<IdResponse>(
          `/product_size/product/${savedProductId}/save`,
          {
            sizeName: size.sizeName.trim(),
            sizeDescription: size.sizeDescription.trim(),
            visible: "Y",
            sortOrder: sizeIndex + 1,
          }
        );

        const savedProductSizeId = sizeResponse.data.id;

        if (!savedProductSizeId) {
          throw new Error(
            `${size.sizeName} 사이즈 등록 후 사이즈번호를 받지 못했습니다.`
          );
        }

        savedSizeIdMap.set(size.id, savedProductSizeId);
      }

      // -------------------------------------------------
      // 5. 옵션 / 재고 저장
      // -------------------------------------------------
      for (const option of options) {
        const savedProductColorId = savedColorIdMap.get(option.colorId);
        const savedProductSizeId = savedSizeIdMap.get(option.sizeId);

        if (!savedProductColorId || !savedProductSizeId) {
          throw new Error("옵션 저장에 필요한 색상/사이즈 번호가 없습니다.");
        }

        await axiosInstance.post(
          `/product_option/product/${savedProductId}/save`,
          {
            productColorId: savedProductColorId,
            productSizeId: savedProductSizeId,
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

  return (
    <main className="admin-product-form-page">
      {/* 상단 */}
      <div className="admin-form-header">
        <div>
          <p>PRODUCT MANAGEMENT</p>

          <h1>
            {isEdit ? "상품 수정" : "상품 등록"}
          </h1>

          <span>
            상품 정보와 판매 옵션을 등록합니다.
          </span>
        </div>

        <button
          type="button"
          className="admin-form-back"
          onClick={() => navigate(productListUrl)}
        >
          목록으로
        </button>
      </div>

      {/* ==========================================
          01 기본 정보
      ========================================== */}
      <section className="admin-form-section">
        <div className="admin-form-section-title">
          <span>01</span>

          <div>
            <h2>기본 정보</h2>
            <p>상품의 기본 정보를 입력해주세요.</p>
          </div>
        </div>

        <div className="admin-form-grid">
          <div className="admin-form-field full">
            <label>상품명 *</label>

            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleProductChange}
              placeholder="상품명을 입력해주세요."
            />
          </div>

          {/* 브랜드 */}
          <div className="admin-form-field full">
            <label>브랜드 *</label>

            <input
              type="text"
              name="brand"
              value={product.brand}
              onChange={handleProductChange}
              placeholder="예: ONNIVER"
            />
          </div>

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
                    : "대분류를 먼저 선택해주세요"}
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
              <p>하위 카테고리가 없어 대분류 자체로 등록됩니다.</p>
            </div>
          ) : (
            <div className="admin-form-field">
              <label>하위 카테고리</label>
              <input
                type="text"
                value=""
                placeholder="대분류를 먼저 선택해주세요"
                readOnly
              />
            </div>
          )}

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

              <span>원</span>
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
                할인 적용가{" "}
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
            <label>판매 상태</label>

            <select
              name="status"
              value={product.status}
              onChange={handleProductChange}
            >
              <option value="판매중">판매중</option>
              <option value="품절">품절</option>
              <option value="판매중지">판매중지</option>
            </select>
          </div>

          <div className="admin-form-field">
            <label>AI 피팅</label>

            <select
              name="fittingEnabled"
              value={product.fittingEnabled}
              onChange={handleProductChange}
            >
              <option value="Y">사용</option>
              <option value="N">사용 안 함</option>
            </select>
          </div>

          <div className="admin-form-field full">
            <label>상품 설명</label>

            <textarea
              name="description"
              value={product.description}
              onChange={handleProductChange}
              placeholder="상품 설명을 입력해주세요."
              rows={5}
            />
          </div>

          <div className="admin-form-field">
            <label>소재</label>

            <input
              type="text"
              name="material"
              value={product.material}
              onChange={handleProductChange}
              placeholder="예: Cotton 100%"
            />
          </div>

          <div className="admin-form-field">
            <label>세탁 정보</label>

            <input
              type="text"
              name="washingInfo"
              value={product.washingInfo}
              onChange={handleProductChange}
              placeholder="예: 단독 세탁 권장"
            />
          </div>
        </div>
      </section>

      {/* ==========================================
          02 색상 / 이미지
      ========================================== */}
      <section className="admin-form-section">
        <div className="admin-form-section-title">
          <span>02</span>

          <div>
            <h2>색상 및 이미지</h2>
            <p>
              판매할 색상과 색상별 상품 이미지를
              등록해주세요.
            </p>
          </div>

          <button
            type="button"
            className="admin-outline-button"
            onClick={addColor}
          >
            + 색상 추가
          </button>
        </div>

        <div className="admin-color-list">
          {colors.map((color, index) => {
            const thumbnailImages = color.images.filter(
              (image) => image.imageType === "THUMBNAIL"
            );
            const detailImages = color.images.filter(
              (image) => image.imageType === "DETAIL"
            );

            return (
              <div className="admin-color-card" key={color.id}>
                <div className="admin-color-card-header">
                  <strong>
                    COLOR {String(index + 1).padStart(2, "0")}
                  </strong>

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
                      <option value="">COLOR 테이블에서 선택</option>
                      {masterColors.map((masterColor) => (
                        <option key={masterColor.id} value={masterColor.id}>
                          {masterColor.colorName} ({masterColor.colorCode})
                        </option>
                      ))}
                    </select>

                    {color.masterColorId && (
                      <p>
                        <span
                          style={{
                            display: "inline-block",
                            width: 14,
                            height: 14,
                            marginRight: 8,
                            border: "1px solid #d8d8d8",
                            verticalAlign: "-2px",
                            backgroundColor: color.colorCode,
                          }}
                        />
                        {color.colorName} · {color.colorCode}
                      </p>
                    )}
                  </div>
                </div>

                <div className="admin-image-upload">
                  <label>상품 썸네일 / 상단 갤러리 이미지</label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      changeImages(color.id, "THUMBNAIL", event)
                    }
                  />

                  <p>
                    여러 장 등록할 수 있으며 첫 번째 썸네일 이미지가 대표 이미지로 사용됩니다.
                  </p>

                  {thumbnailImages.length > 0 && (
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

                <div className="admin-image-upload">
                  <label>상품 상세 설명 이미지</label>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      changeImages(color.id, "DETAIL", event)
                    }
                  />

                  <p>
                    이 이미지는 상품 상세페이지 아래 PRODUCT INFORMATION 영역에 표시됩니다.
                  </p>

                  {detailImages.length > 0 && (
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
            );
          })}
        </div>
      </section>

      {/* ==========================================
          03 사이즈
      ========================================== */}
      <section className="admin-form-section">
        <div className="admin-form-section-title">
          <span>03</span>

          <div>
            <h2>사이즈</h2>
            <p>
              상품에서 판매할 사이즈를 설정해주세요.
            </p>
          </div>

          <button
            type="button"
            className="admin-outline-button"
            onClick={addSize}
          >
            + 사이즈 추가
          </button>
        </div>

        <div className="admin-size-list">
          {sizes.map((size) => (
            <div
              className="admin-size-row"
              key={size.id}
            >
              <input
                type="text"
                value={size.sizeName}
                onChange={(event) =>
                  changeSize(
                    size.id,
                    "sizeName",
                    event.target.value
                  )
                }
                placeholder="사이즈"
              />

              <input
                type="text"
                value={size.sizeDescription}
                onChange={(event) =>
                  changeSize(
                    size.id,
                    "sizeDescription",
                    event.target.value
                  )
                }
                placeholder="사이즈 설명 (선택)"
              />

              <button
                type="button"
                onClick={() => removeSize(size.id)}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ==========================================
          04 옵션 / 재고
      ========================================== */}
      <section className="admin-form-section">
        <div className="admin-form-section-title">
          <span>04</span>

          <div>
            <h2>옵션 및 재고</h2>
            <p>
              색상과 사이즈 조합별 재고를
              입력해주세요.
            </p>
          </div>

          <button
            type="button"
            className="admin-outline-button"
            onClick={generateOptions}
          >
            옵션 조합 생성
          </button>
        </div>

        {options.length === 0 ? (
          <div className="admin-option-empty">
            색상과 사이즈를 입력한 후
            <strong> 옵션 조합 생성</strong>을 눌러주세요.
          </div>
        ) : (
          <div className="admin-option-table-wrap">
            <table className="admin-option-table">
              <thead>
                <tr>
                  <th>색상</th>
                  <th>사이즈</th>
                  <th>재고</th>
                  <th>추가 금액</th>
                </tr>
              </thead>

              <tbody>
                {options.map((option) => (
                  <tr
                    key={`${option.colorId}-${option.sizeId}`}
                  >
                    <td>
                      {findColorName(option.colorId)}
                    </td>

                    <td>
                      {findSizeName(option.sizeId)}
                    </td>

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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 하단 버튼 */}
      <div className="admin-form-actions">
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
            ? "등록 중..."
            : isEdit
              ? "수정 저장"
              : "상품 등록"}
        </button>
      </div>
    </main>
  );
};

export default AdminProductForm;